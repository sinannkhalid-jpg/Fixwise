"""
Unit Tests for Multimodal Classification Engine.
"""

import pytest
from app.schemas.analysis import AnalyzeReportRequest, GPSCoordinates
from app.schemas.common import IssueCategory, DepartmentType
from app.engines.classifier import classifier_engine


@pytest.mark.asyncio
async def test_pothole_classification():
    req = AnalyzeReportRequest(
        description="Massive dangerous pothole right in front of City General Hospital emergency entrance. Cars are damaging rims.",
        location=GPSCoordinates(latitude=37.7749, longitude=-122.4194)
    )
    res = await classifier_engine.analyze_report(req)
    
    assert res.category == IssueCategory.POTHOLE
    assert res.recommended_department == DepartmentType.ROADS
    assert res.severity >= 0.70
    assert res.safety_risk >= 0.70
    assert res.confidence >= 0.75
    assert len(res.embedding) == 768


@pytest.mark.asyncio
async def test_flooding_classification():
    req = AnalyzeReportRequest(
        description="Major flooding across Main Boulevard. Storm water is 2 feet deep and blocking vehicles.",
        location=GPSCoordinates(latitude=37.7833, longitude=-122.4167)
    )
    res = await classifier_engine.analyze_report(req)
    
    assert res.category == IssueCategory.FLOODING
    assert res.recommended_department == DepartmentType.DRAINAGE
    assert res.severity >= 0.80
    assert res.estimated_urgency_hours <= 24


@pytest.mark.asyncio
async def test_broken_streetlight_classification():
    req = AnalyzeReportRequest(
        description="Dark street light pole #42 is broken and not working. Pedestrians cannot see at night.",
        location=GPSCoordinates(latitude=37.7650, longitude=-122.4200)
    )
    res = await classifier_engine.analyze_report(req)
    
    assert res.category == IssueCategory.BROKEN_STREETLIGHT
    assert res.recommended_department == DepartmentType.ELECTRICAL_TRAFFIC
    assert "night_visibility_hazard" in res.hazard_tags


@pytest.mark.asyncio
async def test_gibberish_requires_human_review():
    req = AnalyzeReportRequest(
        description="ftutftuiufgtydretsfygtyd",
        location=GPSCoordinates(latitude=18.63, longitude=73.80),
    )
    res = await classifier_engine.analyze_report(req)

    assert res.category == IssueCategory.OTHER
    assert res.confidence < 0.60
    assert res.risk_analysis.risk_score >= 0.60
    assert res.risk_analysis.risk_level in {"HIGH", "VERY_HIGH"}
    assert res.requires_manual_review is True
