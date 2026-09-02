"""
Hybrid Duplicate Detection Engine.
Combines 768-dim Vector Embeddings, Haversine GPS Distance, Category Matching,
and Temporal Decay into a calibrated duplicate probability score.
"""

import math
from datetime import datetime, timezone
import numpy as np
from typing import List, Tuple, Optional
from config import settings
from app.schemas.duplicate import (
    CandidateCase,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    DuplicateMatchResult
)
from app.schemas.common import IssueCategory
from app.core.gemini_client import gemini_client


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two GPS coordinates in meters.
    """
    R = 6371000.0  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return R * c


def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Calculates cosine similarity between two float vectors.
    """
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    
    return float(np.dot(a, b) / (norm_a * norm_b))


def parse_iso_datetime(dt_str: str) -> datetime:
    """Safely parse ISO datetime string with fallback to current UTC."""
    try:
        if dt_str.endswith("Z"):
            dt_str = dt_str[:-1] + "+00:00"
        return datetime.fromisoformat(dt_str)
    except Exception:
        return datetime.now(timezone.utc)


class DuplicateDetectionEngine:
    def __init__(self):
        self.w_vector = settings.DUPLICATE_VECTOR_WEIGHT      # 0.40
        self.w_gps = settings.DUPLICATE_GPS_WEIGHT            # 0.35
        self.w_category = settings.DUPLICATE_CATEGORY_WEIGHT  # 0.15
        self.w_time = settings.DUPLICATE_TIME_WEIGHT          # 0.10

        self.definite_threshold = settings.DUPLICATE_DEFINITE_THRESHOLD    # 0.75
        self.potential_threshold = settings.DUPLICATE_POTENTIAL_THRESHOLD  # 0.50
        self.max_gps_radius = settings.DUPLICATE_MAX_GPS_METERS           # 150m
        self.max_time_days = settings.DUPLICATE_MAX_TIME_DAYS             # 30 days

    async def check_duplicates(self, request: DuplicateCheckRequest) -> DuplicateCheckResponse:
        """
        Evaluates new citizen report against active candidate cases in proximity.
        """
        # Ensure embedding exists for new report
        new_vec = request.new_embedding
        if not new_vec:
            new_vec = await gemini_client.generate_embedding(request.new_description)

        new_time = parse_iso_datetime(request.new_timestamp)
        match_results: List[DuplicateMatchResult] = []

        for candidate in request.candidate_cases:
            # 1. GPS Distance calculation & scoring
            distance_meters = haversine_distance_meters(
                request.new_location.latitude,
                request.new_location.longitude,
                candidate.location.latitude,
                candidate.location.longitude
            )
            
            # Distance score: 1.0 at 0m, decaying to 0.0 at max_gps_radius (150m)
            gps_score = max(0.0, 1.0 - (distance_meters / self.max_gps_radius))

            # 2. Vector Semantic Similarity
            cand_vec = candidate.embedding
            if not cand_vec:
                cand_vec = await gemini_client.generate_embedding(candidate.description)
            
            vec_sim = cosine_similarity(new_vec, cand_vec)
            # Clamp cosine similarity from [-1, 1] to [0, 1]
            vec_score = max(0.0, min(1.0, (vec_sim + 1.0) / 2.0 if vec_sim < 0 else vec_sim))

            # 3. Category Match Score
            cat_match = (request.new_category == candidate.category)
            if cat_match:
                cat_score = 1.0
            elif {request.new_category, candidate.category} in [
                {IssueCategory.POTHOLE, IssueCategory.DAMAGED_ROAD},
                {IssueCategory.FLOODING, IssueCategory.DRAINAGE_PROBLEM}
            ]:
                cat_score = 0.60  # Related municipal categories
            else:
                cat_score = 0.0

            # 4. Temporal Decay Score
            cand_time = parse_iso_datetime(candidate.timestamp)
            delta_days = abs((new_time - cand_time).total_seconds()) / 86400.0
            time_score = max(0.0, 1.0 - (delta_days / self.max_time_days))

            # 5. Composite Probability Score
            # If distance exceeds 200m or completely different categories, duplicate probability is heavily penalised
            if distance_meters > (self.max_gps_radius * 1.5):
                gps_penalty = 0.2
            else:
                gps_penalty = 1.0

            composite_score = (
                (self.w_vector * vec_score) +
                (self.w_gps * gps_score) +
                (self.w_category * cat_score) +
                (self.w_time * time_score)
            ) * gps_penalty

            composite_score = max(0.0, min(1.0, composite_score))

            is_definite = composite_score >= self.definite_threshold
            is_potential = composite_score >= self.potential_threshold

            # Rationale generation
            if is_definite:
                rationale = (
                    f"Strong duplicate match ({composite_score*100:.1f}%): "
                    f"Located {distance_meters:.1f}m away with {vec_sim:.2f} textual semantic similarity in category '{candidate.category.value}'."
                )
            elif is_potential:
                rationale = (
                    f"Possible duplicate ({composite_score*100:.1f}%): "
                    f"Located {distance_meters:.1f}m away, reported {delta_days:.1f} days apart. Admin review suggested."
                )
            else:
                rationale = f"Distinct report: distance {distance_meters:.1f}m, similarity {vec_sim:.2f}."

            match_results.append(
                DuplicateMatchResult(
                    case_id=candidate.case_id,
                    duplicate_probability=round(composite_score, 4),
                    vector_similarity=round(vec_sim, 4),
                    gps_distance_meters=round(distance_meters, 2),
                    category_match=cat_match,
                    time_delta_days=round(delta_days, 2),
                    is_definite_duplicate=is_definite,
                    is_potential_duplicate=is_potential,
                    rationale=rationale
                )
            )

        # Sort matches by duplicate probability descending
        match_results.sort(key=lambda m: m.duplicate_probability, reverse=True)

        top_match = match_results[0] if match_results else None
        has_dup = bool(top_match and top_match.is_potential_duplicate)

        recommended_action = "CREATE_NEW_CASE"
        if top_match:
            if top_match.is_definite_duplicate:
                recommended_action = "LINK_TO_EXISTING_CASE"
            elif top_match.is_potential_duplicate:
                recommended_action = "FLAG_FOR_MANUAL_REVIEW"

        return DuplicateCheckResponse(
            has_duplicate=has_dup,
            recommended_action=recommended_action,
            top_match=top_match,
            all_matches=match_results
        )


duplicate_engine = DuplicateDetectionEngine()
