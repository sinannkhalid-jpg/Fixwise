"""
API Endpoint: Hotspot Detection
Provides spatial clustering analysis for maps and analytics dashboards.
"""

from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.civic_intelligence import (
    HotspotsResponse,
    HotspotsQuery,
    IncidentPoint
)
from app.schemas.common import IssueCategory
from app.engines.hotspot_engine import hotspot_engine

router = APIRouter()


@router.post(
    "/hotspots",
    response_model=HotspotsResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect Hotspots from Incidents",
    description="Clusters incident coordinates into geographic hotspots using spatial radius aggregation."
)
def detect_hotspots_post(query: HotspotsQuery) -> HotspotsResponse:
    try:
        incidents = query.incidents or []
        response = hotspot_engine.detect_hotspots(
            incidents=incidents,
            municipality_id=query.municipality_id,
            category=query.category,
            eps_meters=query.eps_meters,
            min_incidents=query.min_incidents
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotspot detection failed: {str(e)}"
        )
