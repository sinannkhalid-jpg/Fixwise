"""
Fake / Spam / Fraud Risk Engine.
Evaluates multi-factor risk signals without binary rejection to prevent
spam abuse while protecting authentic citizen submissions.
"""

from typing import List
from config import settings
from app.schemas.risk import RiskAssessmentRequest, RiskAssessmentResponse
from app.schemas.common import RiskLevel, RiskAction


class RiskEngine:
    def __init__(self):
        self.threshold_low = settings.RISK_THRESHOLD_LOW        # 39
        self.threshold_medium = settings.RISK_THRESHOLD_MEDIUM  # 69
        self.threshold_high = settings.RISK_THRESHOLD_HIGH      # 84

    def assess_risk(self, req: RiskAssessmentRequest) -> RiskAssessmentResponse:
        """
        Computes dynamic multi-factor risk score (0-100) and actionable operational tier.
        """
        score = 0
        flagged_factors: List[str] = []

        # Factor 1: Submission Velocity (Frequency within 24h)
        if req.submissions_last_24h >= 10:
            score += 40
            flagged_factors.append("excessive_submission_velocity_10plus_24h")
        elif req.submissions_last_24h >= 5:
            score += 20
            flagged_factors.append("elevated_submission_frequency_5plus_24h")

        # Factor 2: Historical User Credibility
        total_history = req.user_historical_verified_count + req.user_historical_rejected_count
        if total_history >= 3:
            reject_ratio = req.user_historical_rejected_count / total_history
            if reject_ratio >= 0.60:
                score += 35
                flagged_factors.append(f"high_historical_rejection_rate_{int(reject_ratio*100)}pct")
            elif reject_ratio >= 0.30:
                score += 15
                flagged_factors.append("moderate_historical_rejection_rate")
            elif reject_ratio == 0.0 and req.user_historical_verified_count >= 5:
                # Trusted citizen credit discount
                score -= 15

        # Factor 3: Image-to-Text Semantic Consistency
        if req.has_image:
            if req.image_text_consistency_score < 0.30:
                score += 35
                flagged_factors.append("severe_image_description_mismatch")
            elif req.image_text_consistency_score < 0.55:
                score += 15
                flagged_factors.append("moderate_image_description_inconsistency")
        else:
            score += 10
            flagged_factors.append("missing_photo_evidence")

        # Factor 4: Impossible GPS Teleportation / Jump Velocity
        if req.gps_implausible_speed_flag:
            score += 30
            flagged_factors.append("implausible_gps_velocity_teleportation")

        # Factor 5: Repeated Image Hash across disparate locations
        if req.repeated_image_hash_flag:
            score += 40
            flagged_factors.append("duplicate_image_hash_across_distant_locations")

        # Factor 6: Text Spam / Toxicity / Gibberish Score
        if req.text_spam_suspicion_score >= 0.70:
            score += 25
            flagged_factors.append("text_spam_pattern_detected")
        elif req.text_spam_suspicion_score >= 0.40:
            score += 10
            flagged_factors.append("unusual_text_syntax_pattern")

        # Clamp score to [0, 100]
        final_score = max(0, min(100, score))

        # Determine Risk Level and Action
        if final_score <= self.threshold_low:
            level = RiskLevel.LOW
            action = RiskAction.NORMAL_PROCESSING
            is_held = False
        elif final_score <= self.threshold_medium:
            level = RiskLevel.MEDIUM
            action = RiskAction.ADDITIONAL_VERIFICATION
            is_held = False
        elif final_score <= self.threshold_high:
            level = RiskLevel.HIGH
            action = RiskAction.MANUAL_REVIEW
            is_held = True
        else:
            level = RiskLevel.VERY_HIGH
            action = RiskAction.HOLD_RESTRICT
            is_held = True

        if flagged_factors:
            explanation = (
                f"Risk assessment score: {final_score}/100 ({level.value}). "
                f"Triggered factors: {', '.join(flagged_factors)}. Action: {action.value}."
            )
        else:
            explanation = f"Normal risk score: {final_score}/100 ({level.value}). Report cleared for standard municipal processing."

        return RiskAssessmentResponse(
            risk_score=final_score,
            risk_level=level,
            action=action,
            flagged_factors=flagged_factors,
            is_held_for_review=is_held,
            explanation=explanation
        )


risk_engine = RiskEngine()
