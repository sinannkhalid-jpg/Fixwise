"""
Pydantic Schemas for Multimodal Report Analysis (Gemini / Gemma Intake).
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import IssueCategory, DepartmentType


class GPSCoordinates(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    accuracy_meters: Optional[float] = Field(default=None, description="GPS accuracy in meters")


class AnalyzeReportRequest(BaseModel):
    description: str = Field(..., min_length=3, description="Citizen's textual description of the issue")
    image_base64: Optional[str] = Field(default=None, description="Base64 encoded JPEG/PNG image data")
    image_url: Optional[str] = Field(default=None, description="Publicly accessible URL to incident image")
    location: Optional[GPSCoordinates] = Field(default=None, description="GPS location of the incident")
    timestamp: Optional[str] = Field(default=None, description="ISO 8601 timestamp of report submission")
    municipality_id: Optional[str] = Field(default=None, description="Municipality identifier if pre-resolved")
    citizen_id: Optional[str] = Field(default=None, description="ID of reporting citizen for risk tracking")

    model_config = {
        "json_schema_extra": {
            "example": {
                "description": "Massive deep pothole on Elm Street right outside the hospital emergency entrance. Cars are swerving dangerously.",
                "image_url": "https://storage.civicplatform.org/complaints/pothole_elm.jpg",
                "location": {
                    "latitude": 37.7749,
                    "longitude": -122.4194,
                    "accuracy_meters": 5.0
                },
                "timestamp": "2026-09-02T10:30:00Z",
                "municipality_id": "muni_san_francisco_01"
            }
        }
    }


class AnalyzeReportResponse(BaseModel):
    category: IssueCategory = Field(..., description="Categorized civic issue type")
    subcategory: str = Field(..., description="Detailed sub-type classification")
    severity: float = Field(..., ge=0.0, le=1.0, description="Damage and operational severity (0.0 to 1.0)")
    safety_risk: float = Field(..., ge=0.0, le=1.0, description="Public safety hazard probability (0.0 to 1.0)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence score for the classification (0.0 to 1.0)")
    recommended_department: DepartmentType = Field(..., description="Recommended handling municipal department")
    visual_evidence_summary: str = Field(..., description="Concise synopsis of visual and textual findings")
    hazard_tags: List[str] = Field(default_factory=list, description="Extracted hazard/risk keywords")
    estimated_urgency_hours: int = Field(default=24, description="AI suggested maximum response window in hours")
    embedding: Optional[List[float]] = Field(default=None, description="768-dimensional text/multimodal vector embedding for pgvector")
    ai_metadata: Dict[str, Any] = Field(default_factory=dict, description="Diagnostic metadata (model used, latency, mock status)")
