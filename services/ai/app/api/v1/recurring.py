"""
API Endpoint: Recurring Problem Detection
Identifies systemic localized failure trends and generates municipal root-cause insights.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, status
from app.schemas.civic_intelligence import (
    IncidentPoint,
    RecurringProblemsResponse
)
from app.engines.recurring_engine import recurring_engine

router = APIRouter()


class DetectRecurringRequest(BaseModel):
    incidents: List[IncidentPoint] = Field(..., description="Historical list of complaints to analyze")
    municipality_name: Optional[str] = Field(default="City Municipality", description="Municipality name")


@router.post(
    "/recurring-problems",
    response_model=RecurringProblemsResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect Recurring Civic Problems",
    description="Groups historical complaints spatially (within 100m) and temporally (across months) to detect chronic infrastructure issues and root causes."
)
async def detect_recurring_problems(request: DetectRecurringRequest) -> RecurringProblemsResponse:
    try:
        response = await recurring_engine.detect_recurring_problems(
            incidents=request.incidents,
            municipality_name=request.municipality_name or "City Municipality"
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recurring problem detection failed: {str(e)}"
        )
