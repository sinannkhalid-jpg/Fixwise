"""
Pydantic Schemas for Hybrid Duplicate Incident Detection.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.common import IssueCategory
from app.schemas.analysis import GPSCoordinates


class CandidateCase(BaseModel):
    case_id: str = Field(..., description="Unique case identifier in the backend database")
    category: IssueCategory = Field(..., description="Category of existing active case")
    description: str = Field(..., description="Description of existing active case")
    location: GPSCoordinates = Field(..., description="GPS coordinate of existing active case")
    timestamp: str = Field(..., description="ISO 8601 creation timestamp of existing case")
    status: str = Field(default="OPEN", description="Current status of the case")
    report_count: int = Field(default=1, description="Number of currently linked citizen reports")
    embedding: Optional[List[float]] = Field(default=None, description="Pre-computed 768-dim embedding vector")


class DuplicateCheckRequest(BaseModel):
    new_description: str = Field(..., description="Text description of the newly submitted report")
    new_category: IssueCategory = Field(..., description="Category of new report")
    new_location: GPSCoordinates = Field(..., description="GPS coordinates of new report")
    new_timestamp: str = Field(..., description="ISO 8601 timestamp of new report")
    new_embedding: Optional[List[float]] = Field(default=None, description="Pre-computed embedding vector of new report")
    candidate_cases: List[CandidateCase] = Field(..., description="List of active candidate cases retrieved from database")


class DuplicateMatchResult(BaseModel):
    case_id: str = Field(..., description="ID of the candidate case")
    duplicate_probability: float = Field(..., ge=0.0, le=1.0, description="Blended duplicate score (0.0 to 1.0)")
    vector_similarity: float = Field(..., ge=-1.0, le=1.0, description="Cosine similarity of text/multimodal embeddings")
    gps_distance_meters: float = Field(..., ge=0.0, description="Great-circle Haversine distance in meters")
    category_match: bool = Field(..., description="Whether the issue categories match")
    time_delta_days: float = Field(..., ge=0.0, description="Time difference in days between reports")
    is_definite_duplicate: bool = Field(..., description="True if score >= definite threshold (default 0.75)")
    is_potential_duplicate: bool = Field(..., description="True if score >= potential threshold (default 0.50)")
    rationale: str = Field(..., description="Explainable reason for match decision")


class DuplicateCheckResponse(BaseModel):
    has_duplicate: bool = Field(..., description="True if at least one candidate exceeds potential duplicate threshold")
    recommended_action: str = Field(..., description="'LINK_TO_EXISTING_CASE' | 'FLAG_FOR_MANUAL_REVIEW' | 'CREATE_NEW_CASE'")
    top_match: Optional[DuplicateMatchResult] = Field(default=None, description="Best candidate match if found")
    all_matches: List[DuplicateMatchResult] = Field(default_factory=list, description="All evaluated candidate matches sorted by probability")
