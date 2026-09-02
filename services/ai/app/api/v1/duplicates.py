"""
API Endpoint: POST /api/v1/ai/duplicate-check
Evaluates duplicate likelihood across vector similarity, GPS proximity, category, and time.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.duplicate import DuplicateCheckRequest, DuplicateCheckResponse
from app.engines.duplicate_engine import duplicate_engine

router = APIRouter()


@router.post(
    "/duplicate-check",
    response_model=DuplicateCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Duplicate Incident Detection",
    description="Hybrid duplicate checker evaluating vector embeddings, Haversine GPS distance, category matching, and temporal decay."
)
async def check_duplicate_incident(request: DuplicateCheckRequest) -> DuplicateCheckResponse:
    try:
        response = await duplicate_engine.check_duplicates(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Duplicate check failed: {str(e)}"
        )
