"""
Deterministic Offline Fallback Engine.
Provides high-fidelity heuristic classification and embedding generation
when Gemini API key is not configured or during upstream network outages.
"""

import re
import hashlib
import numpy as np
from typing import Dict, Any, List, Tuple
from app.schemas.common import IssueCategory, DepartmentType


KEYWORD_CATEGORY_MAP = [
    (
        IssueCategory.POTHOLE,
        DepartmentType.ROADS,
        ["pothole", "potholes", "crater", "sinkhole", "road cavity", "asphalt hole", "deep hole in road", "broken road", "trench"],
        "deep_asphalt_cavity",
        0.75, 0.70,
        ["vehicle_damage_risk", "traffic_swerving", "motorcycle_hazard"]
    ),
    (
        IssueCategory.FLOODING,
        DepartmentType.DRAINAGE,
        ["flood", "flooding", "waterlogged", "submerged", "standing water", "overflow", "monsoon water", "lake on road", "water accumulation"],
        "stormwater_inundation",
        0.85, 0.80,
        ["vehicle_stall", "pedestrian_hazard", "property_inundation"]
    ),
    (
        IssueCategory.GARBAGE_WASTE,
        DepartmentType.SANITATION,
        ["garbage", "trash", "waste", "dumping", "rubbish", "litter", "overflowing bin", "debris", "rotting waste", "dumpyard"],
        "uncollected_solid_waste",
        0.55, 0.40,
        ["hygiene_hazard", "rodent_attraction", "foul_odor"]
    ),
    (
        IssueCategory.BROKEN_STREETLIGHT,
        DepartmentType.ELECTRICAL_TRAFFIC,
        ["streetlight", "street light", "lamp post", "dark street", "light pole", "no lights", "flickering light", "broken lamp", "blackout"],
        "inoperative_luminaire",
        0.60, 0.65,
        ["night_visibility_hazard", "pedestrian_safety", "crime_risk_zone"]
    ),
    (
        IssueCategory.WATER_LEAK,
        DepartmentType.WATER,
        ["water leak", "burst pipe", "pipe leak", "water spraying", "clean water wasting", "hydrant leak", "broken pipeline", "water gushing"],
        "pressurized_pipe_rupture",
        0.70, 0.50,
        ["potable_water_loss", "road_subbase_erosion", "low_pressure_zone"]
    ),
    (
        IssueCategory.DRAINAGE_PROBLEM,
        DepartmentType.DRAINAGE,
        ["drainage", "clogged drain", "blocked sewer", "gutter overflow", "manhole", "storm drain", "manhole open", "sewage overflow"],
        "culvert_manhole_blockage",
        0.80, 0.75,
        ["sewage_contamination", "open_manhole_fall_hazard", "urban_ponding"]
    ),
    (
        IssueCategory.DAMAGED_ROAD,
        DepartmentType.ROADS,
        ["damaged road", "road damage", "cracked road", "cracked asphalt", "broken pavement", "sidewalk broken", "paver blocks missing", "sunken road", "speed bump broken"],
        "structural_pavement_failure",
        0.65, 0.55,
        ["tripping_hazard", "suspension_wear", "uneven_surface"]
    ),
    (
        IssueCategory.TRAFFIC_SIGNAGE,
        DepartmentType.ELECTRICAL_TRAFFIC,
        ["traffic light", "traffic signal", "stop sign", "signboard broken", "traffic signage", "signal not working", "red light broken"],
        "traffic_control_malfunction",
        0.80, 0.85,
        ["intersection_collision_risk", "traffic_gridlock", "pedestrian_crossing_hazard"]
    ),
    (
        IssueCategory.PUBLIC_INFRASTRUCTURE,
        DepartmentType.PUBLIC_WORKS,
        ["bus stop", "bus shelter", "park bench", "guardrail broken", "railing damaged", "public wall", "civic building", "bridge railing"],
        "civic_asset_damage",
        0.55, 0.50,
        ["asset_deterioration", "public_amenity_loss"]
    )
]


def heuristic_classify(description: str, has_image: bool = True) -> Dict[str, Any]:
    """
    Deterministic rule-based keyword & heuristic classifier.
    """
    desc_lower = description.lower()
    
    matched_category = IssueCategory.OTHER
    matched_dept = DepartmentType.GENERAL_MAINTENANCE
    matched_subcategory = "general_civic_issue"
    severity = 0.50
    safety_risk = 0.45
    confidence = 0.82
    hazard_tags = ["civic_maintenance_required"]
    
    # Check keyword rules
    best_match_count = 0
    for cat, dept, keywords, subcat, base_sev, base_risk, tags in KEYWORD_CATEGORY_MAP:
        count = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', desc_lower))
        if count > best_match_count:
            best_match_count = count
            matched_category = cat
            matched_dept = dept
            matched_subcategory = subcat
            severity = base_sev
            safety_risk = base_risk
            hazard_tags = tags
            confidence = min(0.95, 0.85 + (count * 0.03))

    # Unknown or unreadable input must not receive invented high confidence.
    words = re.findall(r"[a-z]+", desc_lower)
    letters = re.findall(r"[a-z]", desc_lower)
    vowels = re.findall(r"[aeiou]", desc_lower)
    no_word_boundaries = len(words) <= 1 and len(letters) >= 18
    vowel_ratio = (len(vowels) / len(letters)) if letters else 0.0
    abnormal_vowels = len(letters) >= 18 and (vowel_ratio < 0.18 or vowel_ratio > 0.72)
    repeated_pattern = bool(re.search(r"(.{2,5})\1{2,}", desc_lower))
    risk_reasons = []
    risk_score = 0.0
    if best_match_count == 0:
        confidence = 0.35
        severity = 0.20
        safety_risk = 0.15
    if len(description.strip()) < 25:
        risk_score += 0.18
        risk_reasons.append("Description is too short to verify")
    if not has_image:
        risk_score += 0.10
        risk_reasons.append("No photo evidence supplied")
    if no_word_boundaries:
        risk_score += 0.48
        risk_reasons.append("Description appears random or unreadable")
    if abnormal_vowels:
        risk_score += 0.24
        risk_reasons.append("Abnormal text pattern detected")
    if repeated_pattern:
        risk_score += 0.28
        risk_reasons.append("Repeated character pattern detected")
    risk_score = min(1.0, risk_score)
    requires_review = confidence < 0.60 or risk_score >= 0.60
    risk_level = "VERY_HIGH" if risk_score >= 0.80 else "HIGH" if risk_score >= 0.60 else "MEDIUM" if risk_score >= 0.35 else "LOW"

    # Adjust severity based on urgency words
    urgency_boost_words = ["urgent", "danger", "dangerous", "emergency", "massive", "huge", "accident", "hospital", "collapsed", "fire"]
    for word in urgency_boost_words:
        if word in desc_lower:
            severity = min(1.0, severity + 0.10)
            safety_risk = min(1.0, safety_risk + 0.12)
            if "urgency_flagged" not in hazard_tags:
                hazard_tags.append("urgent_risk_indicated")

    # Estimated urgency hours based on severity & safety
    urgency_hours = 24
    if safety_risk >= 0.80 or severity >= 0.80:
        urgency_hours = 4
    elif safety_risk >= 0.60 or severity >= 0.60:
        urgency_hours = 24
    elif severity >= 0.40:
        urgency_hours = 72
    else:
        urgency_hours = 168

    visual_summary = (
        f"Automated diagnostic analysis identified {matched_category.value.replace('_', ' ')}: "
        f"{description[:100]}... (Severity: {severity:.2f}, Risk: {safety_risk:.2f})."
    )

    return {
        "category": matched_category,
        "subcategory": matched_subcategory,
        "severity": round(severity, 2),
        "safety_risk": round(safety_risk, 2),
        "confidence": round(confidence, 2),
        "recommended_department": matched_dept,
        "visual_evidence_summary": visual_summary,
        "hazard_tags": hazard_tags,
        "estimated_urgency_hours": urgency_hours,
        "department_confidence": round(confidence, 2),
        "public_impact": round(min(1.0, severity * 0.7 + safety_risk * 0.3), 2),
        "image_analysis": {
            "image_present": has_image,
            "image_relevant": None,
            "visible_issue": None,
            "evidence_confidence": 0.0,
            "sufficient_evidence": False
        },
        "risk_analysis": {
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "reasons": risk_reasons,
            "requires_manual_review": requires_review
        },
        "requires_manual_review": requires_review,
        "review_reasons": risk_reasons if requires_review else [],
        "explanation": visual_summary,
        "embedding": generate_deterministic_embedding(description),
        "ai_metadata": {
            "engine": "heuristic_fallback_v1",
            "offline_mode": True,
            "matched_rules": best_match_count
        }
    }


def generate_deterministic_embedding(text: str, dimensions: int = 768) -> List[float]:
    """
    Generates a deterministic 768-dimensional normalized embedding vector from text.
    Words with similar roots and n-grams map to similar directional subspaces,
    allowing realistic local cosine similarity calculation for offline testing.
    """
    clean_text = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower()).strip()
    words = clean_text.split() if clean_text else ["empty"]
    
    vector = np.zeros(dimensions, dtype=np.float32)
    
    for i, word in enumerate(words):
        # Hash word to seed
        h = int(hashlib.sha256(word.encode('utf-8')).hexdigest(), 16)
        rng = np.random.RandomState(h % (2**32))
        word_vec = rng.standard_normal(dimensions)
        # Weight earlier words slightly higher
        position_weight = 1.0 / (1.0 + (0.1 * i))
        vector += word_vec * position_weight

    # Add overall text hash component
    full_h = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16)
    rng_full = np.random.RandomState(full_h % (2**32))
    vector += rng_full.standard_normal(dimensions) * 0.5

    # Normalize to unit length (L2 norm = 1.0)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    
    return [round(float(x), 6) for x in vector]
