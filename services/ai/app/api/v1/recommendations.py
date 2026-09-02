"""
API Endpoint: POST /api/v1/ai/recommendations
Generates Gemini AI engineering root-cause analyses and municipal policy/action plans.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.civic_intelligence import (
    GenerateRecommendationRequest,
    CivicRecommendationResponse
)
from app.engines.recurring_engine import recurring_engine

router = APIRouter()


@router.post(
    "/recommendations",
    response_model=CivicRecommendationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate AI Civic Recommendations",
    description="Uses Gemini AI to generate short-term mitigations, long-term capital upgrade solutions, and preventative maintenance schedules for any civic issue."
)
async def generate_recommendation(request: GenerateRecommendationRequest) -> CivicRecommendationResponse:
    try:
        response = await recurring_engine.generate_recommendation(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Civic recommendation generation failed: {str(e)}"
        )
