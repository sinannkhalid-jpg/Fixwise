"""
Main API v1 Router Aggregator for AI & Civic Intelligence Service.
"""

from fastapi import APIRouter
from app.api.v1.analyze import router as analyze_router
from app.api.v1.duplicates import router as duplicates_router
from app.api.v1.priority import router as priority_router
from app.api.v1.risk import router as risk_router
from app.api.v1.hotspots import router as hotspots_router
from app.api.v1.recurring import router as recurring_router
from app.api.v1.recommendations import router as recommendations_router

api_v1_router = APIRouter(prefix="/api/v1/ai", tags=["AI & Civic Intelligence"])

api_v1_router.include_router(analyze_router)
api_v1_router.include_router(duplicates_router)
api_v1_router.include_router(priority_router)
api_v1_router.include_router(risk_router)
api_v1_router.include_router(hotspots_router)
api_v1_router.include_router(recurring_router)
api_v1_router.include_router(recommendations_router)
