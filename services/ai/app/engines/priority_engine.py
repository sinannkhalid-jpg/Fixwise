"""
Deterministic 100-Point Priority Engine.
Executes the authoritative municipal scoring formula combining AI metrics,
crowdsourced report density, urban zone criticality, SLA aging, and public impact.
"""

from typing import Dict, Any
from config import settings
from app.schemas.priority import (
    CalculatePriorityRequest,
    CalculatePriorityResponse,
    PriorityBreakdown
)
from app.schemas.common import PriorityLevel, ZoneType


ZONE_WEIGHT_MAP = {
    ZoneType.CRITICAL_FACILITY: 10.0,
    ZoneType.ARTERIAL_HIGHWAY: 7.5,
    ZoneType.COMMERCIAL: 5.5,
    ZoneType.RESIDENTIAL: 3.5,
    ZoneType.REMOTE: 1.5,
}


class PriorityEngine:
    def __init__(self):
        self.max_severity = settings.PRIORITY_MAX_SEVERITY          # 30.0
        self.max_safety_risk = settings.PRIORITY_MAX_SAFETY_RISK    # 20.0
        self.max_reports = settings.PRIORITY_MAX_REPORTS            # 20.0
        self.max_location = settings.PRIORITY_MAX_LOCATION          # 10.0
        self.max_age = settings.PRIORITY_MAX_AGE                    # 10.0
        self.max_public_impact = settings.PRIORITY_MAX_PUBLIC_IMPACT# 10.0

    def calculate_priority(self, req: CalculatePriorityRequest) -> CalculatePriorityResponse:
        """
        Calculates exact deterministic 0-100 score and assigns priority tier.
        """
        # 1. Severity Points (0 - 30)
        severity_pts = min(self.max_severity, req.severity * self.max_severity)

        # 2. Safety Risk Points (0 - 20)
        safety_pts = min(self.max_safety_risk, req.safety_risk * self.max_safety_risk)

        # 3. Number of Linked Reports Points (0 - 20)
        # 1 report = 4 pts, 2 = 8 pts, 3 = 12 pts, 4 = 16 pts, 5+ = 20 pts
        reports_count = max(1, req.linked_report_count)
        report_pts = min(self.max_reports, float(reports_count * 4.0))

        # 4. Location Importance Points (0 - 10)
        loc_pts = ZONE_WEIGHT_MAP.get(req.zone_type, 3.5)
        loc_pts = min(self.max_location, loc_pts)

        # 5. Complaint Age / SLA Urgency Points (0 - 10)
        target_hours = max(1.0, req.sla_target_hours or 48.0)
        age_ratio = min(1.0, req.complaint_age_hours / target_hours)
        age_pts = min(self.max_age, age_ratio * self.max_age)

        # 6. Public Impact Multiplier Points (0 - 10)
        impact_mult = req.public_impact_multiplier if req.public_impact_multiplier is not None else 0.5
        impact_pts = min(self.max_public_impact, impact_mult * self.max_public_impact)

        # Total 100-Point Score
        raw_total = severity_pts + safety_pts + report_pts + loc_pts + age_pts + impact_pts
        total_score = round(min(100.0, max(0.0, raw_total)), 2)

        # Determine Priority Tier & Recommended SLA
        if total_score >= 80.0:
            level = PriorityLevel.CRITICAL
            sla_hours = 4
        elif total_score >= 60.0:
            level = PriorityLevel.HIGH
            sla_hours = 24
        elif total_score >= 40.0:
            level = PriorityLevel.MEDIUM
            sla_hours = 72
        else:
            level = PriorityLevel.LOW
            sla_hours = 168

        # Escalation flag if high risk or critical threshold reached
        escalate = (level == PriorityLevel.CRITICAL) or (req.safety_risk >= 0.85) or (age_ratio >= 0.90)

        breakdown = PriorityBreakdown(
            severity_points=round(severity_pts, 2),
            safety_risk_points=round(safety_pts, 2),
            report_count_points=round(report_pts, 2),
            location_importance_points=round(loc_pts, 2),
            complaint_age_points=round(age_pts, 2),
            public_impact_points=round(impact_pts, 2)
        )

        explanation = (
            f"Case prioritized as {level.value} ({total_score}/100) based on: "
            f"Severity ({severity_pts:.1f}/30), Safety Risk ({safety_pts:.1f}/20), "
            f"{reports_count} Citizen Report(s) ({report_pts:.1f}/20), "
            f"Zone '{req.zone_type.value}' ({loc_pts:.1f}/10), "
            f"Age/SLA ({age_pts:.1f}/10), and Impact ({impact_pts:.1f}/10)."
        )

        return CalculatePriorityResponse(
            total_score=total_score,
            priority_level=level,
            breakdown=breakdown,
            recommended_sla_hours=sla_hours,
            escalation_flag=escalate,
            explanation=explanation
        )


priority_engine = PriorityEngine()
