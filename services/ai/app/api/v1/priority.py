"""
API Endpoint: POST /api/v1/ai/priority-score
Executes the deterministic 100-point priority scoring formula.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.priority import CalculatePriorityRequest, CalculatePriorityResponse
from app.engines.priority_engine import priority_engine

router = APIRouter()


@router.post(
    "/priority-score",
    response_model=CalculatePriorityResponse,
    status_code=status.HTTP_200_OK,
    summary="Deterministic Priority Calculation",
    description="Calculates 100-point priority score and SLA based on severity (30), safety (20), reports (20), location (10), age (10), and public impact (10)."
)
def calculate_priority_score(request: CalculatePriorityRequest) -> CalculatePriorityResponse:
    try:
        response = priority_engine.calculate_priority(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Priority calculation failed: {str(e)}"
        )
