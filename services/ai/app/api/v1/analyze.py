"""
API Endpoint: POST /api/v1/ai/analyze
Performs multimodal AI classification, severity estimation, safety risk,
department recommendation, and vector embedding generation.
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas.analysis import AnalyzeReportRequest, AnalyzeReportResponse
from app.engines.classifier import classifier_engine

router = APIRouter()


@router.post(
    "/analyze",
    response_model=AnalyzeReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Citizen Complaint",
    description="Processes complaint text, photo/image, and GPS to extract category, severity, safety risk, confidence, department recommendation, and 768-dim vector embedding."
)
async def analyze_complaint(request: AnalyzeReportRequest) -> AnalyzeReportResponse:
    try:
        response = await classifier_engine.analyze_report(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI report analysis failed: {str(e)}"
        )
