"""
AI & Civic Intelligence Platform Microservice.
Member 3 Core Service for Multimodal Classification, Duplicate Detection,
Priority Scoring, Fake Risk Analysis, Hotspots, and Civic Intelligence.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from app.api.v1.router import api_v1_router
from app.core.gemini_client import gemini_client

app = FastAPI(
    title="AI-Powered Civic Intelligence Service",
    description=(
        "Member 3 AI microservice providing multimodal complaint analysis (Gemini 2.0 / Gemma), "
        "pgvector hybrid duplicate detection, deterministic 100-point priority engine, "
        "fake/spam risk scoring, spatial hotspot clustering, recurring problem detection, "
        "and long-term civic infrastructure recommendations."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS for Frontend (Next.js) & Backend (FastAPI / NestJS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount AI API Routes
app.include_router(api_v1_router)


@app.get("/health", tags=["Health & System"])
async def health_check():
    """
    Health check and AI client status endpoint.
    """
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_engine": {
            "gemini_connected": gemini_client.has_valid_key,
            "multimodal_model": settings.GEMINI_MULTIMODAL_MODEL,
            "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
            "offline_fallback_enabled": settings.ENABLE_OFFLINE_MOCK_FALLBACK
        }
    }


@app.get("/", tags=["Health & System"])
async def root():
    return {
        "message": "Welcome to the AI-Powered Citizen Complaint Management & Civic Intelligence API",
        "docs_url": "/docs",
        "health_check": "/health",
        "member_role": "Member 3 — AI & Civic Intelligence Lead"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
