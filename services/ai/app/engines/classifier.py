"""
Report Classification & Multimodal Analysis Engine.
Processes raw citizen submissions (text, image, GPS) through Gemini AI.
"""

from typing import Dict, Any, Optional
from app.core.gemini_client import gemini_client
from app.schemas.analysis import AnalyzeReportRequest, AnalyzeReportResponse


class ClassifierEngine:
    @staticmethod
    async def analyze_report(request: AnalyzeReportRequest) -> AnalyzeReportResponse:
        """
        Runs multimodal classification, severity, safety-risk, and embedding calculation.
        """
        location_str = None
        if request.location:
            location_str = f"Lat: {request.location.latitude}, Lng: {request.location.longitude}"
        
        result_dict = await gemini_client.analyze_complaint(
            description=request.description,
            image_base64=request.image_base64,
            image_url=request.image_url,
            location_text=location_str
        )
        
        return AnalyzeReportResponse(**result_dict)


classifier_engine = ClassifierEngine()
