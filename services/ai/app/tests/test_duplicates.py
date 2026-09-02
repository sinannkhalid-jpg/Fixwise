"""
Unit Tests for Hybrid Duplicate Detection Engine.
"""

import pytest
from app.schemas.duplicate import (
    CandidateCase,
    DuplicateCheckRequest
)
from app.schemas.analysis import GPSCoordinates
from app.schemas.common import IssueCategory
from app.engines.duplicate_engine import duplicate_engine, haversine_distance_meters


def test_haversine_distance():
    # San Francisco City Hall to Ferry Building (~2.3 km)
    dist = haversine_distance_meters(37.7793, -122.4193, 37.7955, -122.3937)
    assert 2200.0 < dist < 2900.0

    # Same point distance should be 0
    assert haversine_distance_meters(37.7749, -122.4194, 37.7749, -122.4194) == 0.0


@pytest.mark.asyncio
async def test_duplicate_detection_close_match():
    # Existing case at coordinate (37.7749, -122.4194)
    existing = CandidateCase(
        case_id="case_pothole_1001",
        category=IssueCategory.POTHOLE,
        description="Deep pothole in center lane near 5th and Market.",
        location=GPSCoordinates(latitude=37.7749, longitude=-122.4194),
        timestamp="2026-09-02T08:00:00Z",
        status="OPEN"
    )

    # New citizen report 15 meters away with similar description
    req = DuplicateCheckRequest(
        new_description="Dangerous pothole on road near Market & 5th, damaged my tire.",
        new_category=IssueCategory.POTHOLE,
        new_location=GPSCoordinates(latitude=37.7750, longitude=-122.4195),
        new_timestamp="2026-09-02T09:30:00Z",
        candidate_cases=[existing]
    )

    res = await duplicate_engine.check_duplicates(req)

    assert res.has_duplicate is True
    assert res.top_match is not None
    assert res.top_match.case_id == "case_pothole_1001"
    assert res.top_match.duplicate_probability >= 0.70
    assert res.top_match.gps_distance_meters < 30.0
    assert res.top_match.category_match is True


@pytest.mark.asyncio
async def test_distinct_incident_no_duplicate():
    # Existing case
    existing = CandidateCase(
        case_id="case_flood_2001",
        category=IssueCategory.FLOODING,
        description="Flooding underpass on Highway 101.",
        location=GPSCoordinates(latitude=37.7749, longitude=-122.4194),
        timestamp="2026-09-02T08:00:00Z",
        status="OPEN"
    )

    # New report 2 km away, different category
    req = DuplicateCheckRequest(
        new_description="Broken streetlight in quiet residential cul-de-sac.",
        new_category=IssueCategory.BROKEN_STREETLIGHT,
        new_location=GPSCoordinates(latitude=37.7900, longitude=-122.4000),
        new_timestamp="2026-09-02T09:30:00Z",
        candidate_cases=[existing]
    )

    res = await duplicate_engine.check_duplicates(req)

    assert res.has_duplicate is False
    assert res.recommended_action == "CREATE_NEW_CASE"
