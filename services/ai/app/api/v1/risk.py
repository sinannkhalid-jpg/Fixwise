"""
API Endpoint: POST /api/v1/ai/risk-assessment
Assesses fake/spam/fraud risk with non-binary risk tiers and recommended actions.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.risk import RiskAssessmentRequest, RiskAssessmentResponse
from app.engines.risk_engine import risk_engine

router = APIRouter()


@router.post(
    "/risk-assessment",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Fake & Spam Risk Assessment",
    description="Multi-factor risk evaluation based on submission frequency, image-text consistency, GPS velocity, and citizen history."
)
def assess_complaint_risk(request: RiskAssessmentRequest) -> RiskAssessmentResponse:
    try:
        response = risk_engine.assess_risk(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk assessment failed: {str(e)}"
        )
