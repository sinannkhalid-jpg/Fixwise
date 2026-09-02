"""
Pydantic Schemas for Fake / Spam / Fraud Risk Engine.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import RiskLevel, RiskAction


class RiskAssessmentRequest(BaseModel):
    citizen_id: Optional[str] = Field(default=None, description="Citizen account identifier")
    submissions_last_24h: int = Field(default=1, ge=0, description="Total complaints submitted by this user in last 24h")
    user_historical_verified_count: int = Field(default=0, ge=0, description="Count of past confirmed legitimate reports")
    user_historical_rejected_count: int = Field(default=0, ge=0, description="Count of past rejected / fake reports")
    has_image: bool = Field(default=True, description="Whether visual photo proof was uploaded")
    image_text_consistency_score: float = Field(default=0.90, ge=0.0, le=1.0, description="AI semantic match between image and description")
    gps_implausible_speed_flag: bool = Field(default=False, description="Flagged if consecutive reports imply impossible travel velocity")
    repeated_image_hash_flag: bool = Field(default=False, description="Flagged if identical photo hash submitted across different coordinates")
    text_spam_suspicion_score: float = Field(default=0.0, ge=0.0, le=1.0, description="Text toxicity, gibberish or spam pattern score")


class RiskAssessmentResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100, description="0 to 100 aggregate risk score")
    risk_level: RiskLevel = Field(..., description="LOW | MEDIUM | HIGH | VERY_HIGH")
    action: RiskAction = Field(..., description="NORMAL_PROCESSING | ADDITIONAL_VERIFICATION | MANUAL_REVIEW | HOLD_RESTRICT")
    flagged_factors: List[str] = Field(default_factory=list, description="Specific risk indicators detected")
    is_held_for_review: bool = Field(..., description="True if manual review or hold is required before dispatching")
    explanation: str = Field(..., description="Human-readable assessment rationale for municipal dashboard")
