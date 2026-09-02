"""
Pydantic Schemas for Hotspots, Recurring Problems, and Civic Intelligence Recommendations.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import IssueCategory
from app.schemas.analysis import GPSCoordinates


class IncidentPoint(BaseModel):
    incident_id: str = Field(..., description="Incident ID")
    category: IssueCategory = Field(..., description="Issue category")
    location: GPSCoordinates = Field(..., description="Incident coordinate")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    severity: float = Field(default=0.5, ge=0.0, le=1.0, description="Severity score")
    status: str = Field(default="OPEN", description="Current status")
    municipality_id: Optional[str] = Field(default=None, description="Municipality ID")


class HotspotCluster(BaseModel):
    cluster_id: str = Field(..., description="Unique cluster identifier")
    category: IssueCategory = Field(..., description="Primary issue category of this hotspot")
    center_location: GPSCoordinates = Field(..., description="Centroid coordinates of cluster")
    radius_meters: float = Field(..., ge=0.0, description="Estimated geographic radius of cluster")
    incident_count: int = Field(..., ge=1, description="Number of incidents aggregated into hotspot")
    average_severity: float = Field(..., ge=0.0, le=1.0, description="Mean severity of cluster incidents")
    critical_incident_count: int = Field(default=0, ge=0, description="Number of high/critical incidents")
    municipality_id: Optional[str] = Field(default=None, description="Municipality identifier")
    incident_ids: List[str] = Field(default_factory=list, description="IDs of incidents in this cluster")
    label: str = Field(..., description="Human-readable hotspot title, e.g., 'Flooding Hotspot - Downtown Sector 4'")


class HotspotsQuery(BaseModel):
    municipality_id: Optional[str] = Field(default=None, description="Filter by municipality")
    category: Optional[IssueCategory] = Field(default=None, description="Filter by category")
    min_incidents: int = Field(default=3, ge=2, description="Minimum incidents to form a hotspot")
    eps_meters: float = Field(default=250.0, ge=50.0, le=2000.0, description="DBSCAN spatial neighborhood radius")
    incidents: Optional[List[IncidentPoint]] = Field(default=None, description="Optional raw incident points if DB bypassed")


class HotspotsResponse(BaseModel):
    total_hotspots: int = Field(..., description="Total hotspot clusters detected")
    hotspots: List[HotspotCluster] = Field(default_factory=list, description="List of detected hotspots")
    generated_at: str = Field(..., description="Timestamp of calculation")


class RecurringProblemItem(BaseModel):
    problem_id: str = Field(..., description="Unique recurring pattern identifier")
    location_label: str = Field(..., description="Descriptive geographic label")
    center_location: GPSCoordinates = Field(..., description="Centroid coordinates")
    category: IssueCategory = Field(..., description="Category exhibiting recurrence")
    total_occurrences: int = Field(..., ge=2, description="Total times reported over historical period")
    time_span_days: int = Field(..., ge=1, description="Historical duration analyzed in days")
    monthly_frequency: Dict[str, int] = Field(default_factory=dict, description="Month-by-month incident breakdown, e.g. {'Jan': 5, 'Feb': 8}")
    severity_trend: str = Field(..., description="'INCREASING' | 'STABLE' | 'DECREASING'")
    probable_root_cause: str = Field(..., description="AI synthesized root cause summary")
    ai_recommendation: str = Field(..., description="Recommended permanent engineering or operational fix")
    estimated_intervention_scope: str = Field(..., description="'ROUTINE_MAINTENANCE' | 'INFRASTRUCTURE_UPGRADE' | 'CAPITAL_PROJECT'")


class RecurringProblemsResponse(BaseModel):
    total_detected: int = Field(..., description="Total recurring patterns found")
    recurring_problems: List[RecurringProblemItem] = Field(default_factory=list, description="Identified recurring problems")
    summary: str = Field(..., description="Overall executive summary for city administrators")


class GenerateRecommendationRequest(BaseModel):
    problem_title: str = Field(..., description="Title of the recurring or critical issue")
    category: IssueCategory = Field(..., description="Civic category")
    location_context: str = Field(..., description="Location details and surrounding infrastructure")
    incident_history_summary: str = Field(..., description="Historical timeline of failures and past repairs")
    municipality_name: Optional[str] = Field(default="Metropolitan District", description="Municipality name")


class CivicRecommendationResponse(BaseModel):
    root_cause_analysis: str = Field(..., description="Detailed engineering/operational root cause analysis")
    short_term_actions: List[str] = Field(..., description="Immediate mitigation steps")
    long_term_solutions: List[str] = Field(..., description="Permanent structural / capital project solutions")
    preventative_maintenance_plan: str = Field(..., description="Ongoing inspection and maintenance frequency")
    expected_civic_impact: str = Field(..., description="Anticipated benefits (reduced complaints, cost savings, safety)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="AI confidence score")
