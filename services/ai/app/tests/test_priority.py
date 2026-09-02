"""
Unit Tests for Deterministic 100-Point Priority Engine.
"""

from app.schemas.priority import CalculatePriorityRequest
from app.schemas.common import PriorityLevel, ZoneType
from app.engines.priority_engine import priority_engine


def test_critical_priority_calculation():
    req = CalculatePriorityRequest(
        severity=0.95,              # 0.95 * 30 = 28.5 pts
        safety_risk=0.90,           # 0.90 * 20 = 18.0 pts
        linked_report_count=5,      # 5 * 4 = 20.0 pts (max)
        zone_type=ZoneType.CRITICAL_FACILITY, # 10.0 pts
        complaint_age_hours=12.0,   # 12 / 24 * 10 = 5.0 pts
        sla_target_hours=24.0,
        public_impact_multiplier=0.9# 0.9 * 10 = 9.0 pts
    )
    # Total = 28.5 + 18.0 + 20.0 + 10.0 + 5.0 + 9.0 = 90.5
    res = priority_engine.calculate_priority(req)

    assert res.total_score >= 80.0
    assert res.priority_level == PriorityLevel.CRITICAL
    assert res.recommended_sla_hours == 4
    assert res.escalation_flag is True
    assert res.breakdown.severity_points == 28.5
    assert res.breakdown.location_importance_points == 10.0


def test_low_priority_calculation():
    req = CalculatePriorityRequest(
        severity=0.20,              # 0.20 * 30 = 6.0 pts
        safety_risk=0.15,           # 0.15 * 20 = 3.0 pts
        linked_report_count=1,      # 1 * 4 = 4.0 pts
        zone_type=ZoneType.REMOTE,  # 1.5 pts
        complaint_age_hours=1.0,    # 1.0 / 168.0 * 10 = ~0.06 pts
        sla_target_hours=168.0,
        public_impact_multiplier=0.1# 1.0 pt
    )
    res = priority_engine.calculate_priority(req)

    assert res.total_score < 40.0
    assert res.priority_level == PriorityLevel.LOW
    assert res.recommended_sla_hours == 168
    assert res.escalation_flag is False
