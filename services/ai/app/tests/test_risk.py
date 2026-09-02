"""
Unit Tests for Fake & Spam Risk Engine.
"""

from app.schemas.risk import RiskAssessmentRequest
from app.schemas.common import RiskLevel, RiskAction
from app.engines.risk_engine import risk_engine


def test_low_risk_legitimate_citizen():
    req = RiskAssessmentRequest(
        citizen_id="citizen_alice_01",
        submissions_last_24h=1,
        user_historical_verified_count=6,
        user_historical_rejected_count=0,
        has_image=True,
        image_text_consistency_score=0.92,
        gps_implausible_speed_flag=False,
        repeated_image_hash_flag=False,
        text_spam_suspicion_score=0.0
    )
    res = risk_engine.assess_risk(req)

    assert res.risk_score <= 39
    assert res.risk_level == RiskLevel.LOW
    assert res.action == RiskAction.NORMAL_PROCESSING
    assert res.is_held_for_review is False


def test_high_risk_spam_submission():
    req = RiskAssessmentRequest(
        citizen_id="suspicious_bot_99",
        submissions_last_24h=12,              # +40
        user_historical_verified_count=1,
        user_historical_rejected_count=5,     # +35
        has_image=True,
        image_text_consistency_score=0.15,    # +35
        gps_implausible_speed_flag=True,      # +30
        repeated_image_hash_flag=True         # +40
    )
    res = risk_engine.assess_risk(req)

    assert res.risk_score >= 85
    assert res.risk_level == RiskLevel.VERY_HIGH
    assert res.action == RiskAction.HOLD_RESTRICT
    assert res.is_held_for_review is True
    assert len(res.flagged_factors) >= 4
