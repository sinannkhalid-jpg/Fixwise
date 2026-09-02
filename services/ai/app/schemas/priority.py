"""
Pydantic Schemas for Deterministic 100-Point Priority Engine.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import PriorityLevel, ZoneType


class PriorityBreakdown(BaseModel):
    severity_points: float = Field(..., ge=0.0, le=30.0, description="Severity points (Max: 30)")
    safety_risk_points: float = Field(..., ge=0.0, le=20.0, description="Safety hazard points (Max: 20)")
    report_count_points: float = Field(..., ge=0.0, le=20.0, description="Number of linked citizen reports (Max: 20)")
    location_importance_points: float = Field(..., ge=0.0, le=10.0, description="Zone criticality points (Max: 10)")
    complaint_age_points: float = Field(..., ge=0.0, le=10.0, description="Unresolved age / SLA delay points (Max: 10)")
    public_impact_points: float = Field(..., ge=0.0, le=10.0, description="Crowdsourced / utility impact points (Max: 10)")


class CalculatePriorityRequest(BaseModel):
    severity: float = Field(..., ge=0.0, le=1.0, description="AI-evaluated severity score (0.0 to 1.0)")
    safety_risk: float = Field(..., ge=0.0, le=1.0, description="AI-evaluated safety hazard score (0.0 to 1.0)")
    linked_report_count: int = Field(default=1, ge=1, description="Total number of linked citizen submissions")
    zone_type: ZoneType = Field(default=ZoneType.RESIDENTIAL, description="Urban zone category of incident coordinate")
    complaint_age_hours: float = Field(default=0.0, ge=0.0, description="Hours elapsed since initial reporting")
    sla_target_hours: Optional[float] = Field(default=48.0, ge=1.0, description="Target SLA resolution window in hours")
    public_impact_multiplier: Optional[float] = Field(default=0.5, ge=0.0, le=1.0, description="Disruption factor (0.0 to 1.0)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "severity": 0.85,
                "safety_risk": 0.90,
                "linked_report_count": 4,
                "zone_type": "critical_facility",
                "complaint_age_hours": 6.5,
                "sla_target_hours": 24.0,
                "public_impact_multiplier": 0.8
            }
        }
    }


class CalculatePriorityResponse(BaseModel):
    total_score: float = Field(..., ge=0.0, le=100.0, description="Deterministic 0-100 total priority score")
    priority_level: PriorityLevel = Field(..., description="CRITICAL (80-100) | HIGH (60-79) | MEDIUM (40-59) | LOW (0-39)")
    breakdown: PriorityBreakdown = Field(..., description="Itemized point contribution breakdown")
    recommended_sla_hours: int = Field(..., description="Prescribed SLA turnaround time in hours")
    escalation_flag: bool = Field(..., description="Flag true if overdue or critical safety hazard")
    explanation: str = Field(..., description="Human-readable justification for the score")
