"""
End-to-End API Integration Tests with FastAPI TestClient.
"""

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ai_engine" in data


def test_analyze_endpoint():
    payload = {
        "description": "Severe road damage and cracked asphalt near 3rd street intersection.",
        "location": {
            "latitude": 37.7749,
            "longitude": -122.4194
        }
    }
    response = client.post("/api/v1/ai/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] in ["damaged_road", "pothole"]
    assert "recommended_department" in data
    assert 0.0 <= data["severity"] <= 1.0
    assert 0.0 <= data["safety_risk"] <= 1.0
    assert len(data["embedding"]) == 768


def test_duplicate_check_endpoint():
    payload = {
        "new_description": "Water pipe leak gushing onto road.",
        "new_category": "water_leak",
        "new_location": {"latitude": 37.7749, "longitude": -122.4194},
        "new_timestamp": "2026-09-02T12:00:00Z",
        "candidate_cases": [
            {
                "case_id": "case_leak_01",
                "category": "water_leak",
                "description": "Burst clean water pipe spraying water on pavement.",
                "location": {"latitude": 37.7750, "longitude": -122.4195},
                "timestamp": "2026-09-02T10:00:00Z"
            }
        ]
    }
    response = client.post("/api/v1/ai/duplicate-check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "has_duplicate" in data
    assert "recommended_action" in data


def test_priority_score_endpoint():
    payload = {
        "severity": 0.90,
        "safety_risk": 0.85,
        "linked_report_count": 3,
        "zone_type": "critical_facility",
        "complaint_age_hours": 5.0,
        "sla_target_hours": 24.0,
        "public_impact_multiplier": 0.8
    }
    response = client.post("/api/v1/ai/priority-score", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_score"] >= 70.0
    assert data["priority_level"] in ["CRITICAL", "HIGH"]
    assert data["recommended_sla_hours"] in [4, 24]


def test_risk_assessment_endpoint():
    payload = {
        "citizen_id": "user_123",
        "submissions_last_24h": 2,
        "user_historical_verified_count": 4,
        "user_historical_rejected_count": 0,
        "has_image": True,
        "image_text_consistency_score": 0.88
    }
    response = client.post("/api/v1/ai/risk-assessment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "LOW"
    assert data["action"] == "NORMAL_PROCESSING"
