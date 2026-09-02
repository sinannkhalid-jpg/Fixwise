"""
Unit Tests for Hotspots & Recurring Problems Engines.
"""

import pytest
from app.schemas.civic_intelligence import IncidentPoint, GPSCoordinates
from app.schemas.common import IssueCategory
from app.engines.hotspot_engine import hotspot_engine
from app.engines.recurring_engine import recurring_engine


def test_hotspot_spatial_clustering():
    # 5 flooding incidents within 100 meters of each other
    incidents = [
        IncidentPoint(
            incident_id=f"flood_inc_{i}",
            category=IssueCategory.FLOODING,
            location=GPSCoordinates(latitude=37.7749 + (i * 0.0002), longitude=-122.4194 + (i * 0.0001)),
            timestamp="2026-09-02T10:00:00Z",
            severity=0.85,
            municipality_id="muni_sf"
        )
        for i in range(5)
    ]

    res = hotspot_engine.detect_hotspots(
        incidents=incidents,
        municipality_id="muni_sf",
        eps_meters=250.0,
        min_incidents=3
    )

    assert res.total_hotspots >= 1
    assert res.hotspots[0].incident_count == 5
    assert res.hotspots[0].category == IssueCategory.FLOODING
    assert res.hotspots[0].radius_meters <= 250.0


@pytest.mark.asyncio
async def test_recurring_problem_detection():
    # 4 incidents at identical location over 4 months
    incidents = [
        IncidentPoint(
            incident_id=f"pothole_inc_{i}",
            category=IssueCategory.POTHOLE,
            location=GPSCoordinates(latitude=37.7749, longitude=-122.4194),
            timestamp=f"2026-0{i+1}-15T10:00:00Z",
            severity=0.60 + (i * 0.1),
            municipality_id="muni_sf"
        )
        for i in range(4)
    ]

    res = await recurring_engine.detect_recurring_problems(
        incidents=incidents,
        municipality_name="Metropolitan District"
    )

    assert res.total_detected >= 1
    problem = res.recurring_problems[0]
    assert problem.total_occurrences == 4
    assert problem.category == IssueCategory.POTHOLE
    assert len(problem.probable_root_cause) > 10
    assert len(problem.ai_recommendation) > 10
