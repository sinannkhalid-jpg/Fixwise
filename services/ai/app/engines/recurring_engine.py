"""
Recurring Problem Detection & AI Civic Recommendations Engine.
Analyzes historical incident temporal patterns, detects systemic infrastructure recurrence,
and generates AI-powered root cause analyses and municipal recommendations.
"""

from datetime import datetime, timezone
from collections import defaultdict
from typing import List, Dict, Any, Optional
from config import settings
from app.schemas.civic_intelligence import (
    IncidentPoint,
    RecurringProblemItem,
    RecurringProblemsResponse,
    GenerateRecommendationRequest,
    CivicRecommendationResponse
)
from app.schemas.analysis import GPSCoordinates
from app.schemas.common import IssueCategory
from app.engines.duplicate_engine import haversine_distance_meters, parse_iso_datetime
from app.core.gemini_client import gemini_client


class RecurringEngine:
    def __init__(self):
        self.spatial_radius_meters = 100.0
        self.min_occurrences = settings.RECURRING_PROBLEM_MIN_OCCURRENCES  # 3
        self.window_days = settings.RECURRING_PROBLEM_WINDOW_DAYS         # 180

    async def detect_recurring_problems(
        self,
        incidents: List[IncidentPoint],
        municipality_name: str = "Metropolitan District"
    ) -> RecurringProblemsResponse:
        """
        Groups historical incidents spatially to identify recurring civic failure hotspots.
        """
        if len(incidents) < self.min_occurrences:
            return RecurringProblemsResponse(
                total_detected=0,
                recurring_problems=[],
                summary="Insufficient historical complaint density to establish recurring patterns."
            )

        # Spatial clustering for identical coordinates within 100m
        groups: List[List[IncidentPoint]] = []
        visited = set()

        for i, p in enumerate(incidents):
            if p.incident_id in visited:
                continue

            cluster = [p]
            for j, other in enumerate(incidents):
                if i != j and other.category == p.category:
                    dist = haversine_distance_meters(
                        p.location.latitude, p.location.longitude,
                        other.location.latitude, other.location.longitude
                    )
                    if dist <= self.spatial_radius_meters:
                        cluster.append(other)

            if len(cluster) >= self.min_occurrences:
                for m in cluster:
                    visited.add(m.incident_id)
                groups.append(cluster)

        recurring_items: List[RecurringProblemItem] = []
        counter = 1

        for cluster in groups:
            # Sort chronologically
            cluster.sort(key=lambda x: parse_iso_datetime(x.timestamp))

            first_dt = parse_iso_datetime(cluster[0].timestamp)
            last_dt = parse_iso_datetime(cluster[-1].timestamp)
            time_span_days = max(1, int((last_dt - first_dt).total_seconds() / 86400.0))

            # Monthly breakdown
            monthly_freq: Dict[str, int] = defaultdict(int)
            for item in cluster:
                dt = parse_iso_datetime(item.timestamp)
                month_key = dt.strftime("%b %Y")
                monthly_freq[month_key] += 1

            # Trend calculation
            severities = [item.severity for item in cluster]
            if len(severities) >= 3:
                first_half_avg = sum(severities[:len(severities)//2]) / (len(severities)//2)
                second_half_avg = sum(severities[len(severities)//2:]) / (len(severities) - len(severities)//2)
                if second_half_avg > first_half_avg + 0.10:
                    trend = "INCREASING"
                elif second_half_avg < first_half_avg - 0.10:
                    trend = "DECREASING"
                else:
                    trend = "STABLE"
            else:
                trend = "STABLE"

            cat = cluster[0].category
            mean_lat = sum(m.location.latitude for m in cluster) / len(cluster)
            mean_lng = sum(m.location.longitude for m in cluster) / len(cluster)

            location_label = f"Recurring {cat.value.replace('_', ' ').title()} Zone #{counter}"
            
            # Formulate history summary for AI
            history_summary = (
                f"{len(cluster)} complaints over {time_span_days} days. "
                f"Monthly counts: {dict(monthly_freq)}. Trend: {trend} severity."
            )

            # Generate AI Root Cause & Recommendation
            ai_recs = await gemini_client.generate_civic_recommendation(
                problem_title=f"Recurring {cat.value} hotspot",
                category=cat.value,
                location_context=f"Coordinates ({mean_lat:.4f}, {mean_lng:.4f})",
                incident_history_summary=history_summary,
                municipality_name=municipality_name
            )

            intervention_scope = "ROUTINE_MAINTENANCE"
            if len(cluster) >= 8 or trend == "INCREASING":
                intervention_scope = "CAPITAL_PROJECT"
            elif len(cluster) >= 5:
                intervention_scope = "INFRASTRUCTURE_UPGRADE"

            recurring_items.append(
                RecurringProblemItem(
                    problem_id=f"rec_prob_{cat.value}_{counter}",
                    location_label=location_label,
                    center_location=GPSCoordinates(
                        latitude=round(mean_lat, 6),
                        longitude=round(mean_lng, 6)
                    ),
                    category=cat,
                    total_occurrences=len(cluster),
                    time_span_days=time_span_days,
                    monthly_frequency=dict(monthly_freq),
                    severity_trend=trend,
                    probable_root_cause=ai_recs.get("root_cause_analysis", "Repetitive failure at localized infrastructure node."),
                    ai_recommendation=ai_recs.get("long_term_solutions", ["Inspect and upgrade civil assets."])[0]
                        if isinstance(ai_recs.get("long_term_solutions"), list) and ai_recs.get("long_term_solutions")
                        else str(ai_recs.get("long_term_solutions", "Inspect asset.")),
                    estimated_intervention_scope=intervention_scope
                )
            )
            counter += 1

        recurring_items.sort(key=lambda x: x.total_occurrences, reverse=True)

        summary = (
            f"Detected {len(recurring_items)} recurring civic problem clusters across {municipality_name}. "
            f"Root cause analyses and structural recommendations generated."
        )

        return RecurringProblemsResponse(
            total_detected=len(recurring_items),
            recurring_problems=recurring_items,
            summary=summary
        )

    async def generate_recommendation(self, req: GenerateRecommendationRequest) -> CivicRecommendationResponse:
        """
        Ad-hoc generation of deep engineering recommendations for any civic problem.
        """
        raw_res = await gemini_client.generate_civic_recommendation(
            problem_title=req.problem_title,
            category=req.category.value,
            location_context=req.location_context,
            incident_history_summary=req.incident_history_summary,
            municipality_name=req.municipality_name or "Metropolitan District"
        )
        return CivicRecommendationResponse(**raw_res)


recurring_engine = RecurringEngine()
