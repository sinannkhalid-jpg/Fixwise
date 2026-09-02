# AI & Civic Intelligence Service API Contract
**Role:** Member 3 — AI & Intelligence Lead  
**Base URL:** `http://localhost:8000/api/v1/ai`  
**Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## 1. Intake Multimodal Analysis
### `POST /api/v1/ai/analyze`
Processes raw citizen submissions (text description, optional photo/base64, GPS coordinates).

#### Request Body
```json
{
  "description": "Massive deep pothole right in front of City General Hospital emergency entrance. Cars are damaging rims.",
  "image_base64": "data:image/jpeg;base64,...", // Optional
  "image_url": "https://storage.supabase.co/.../pothole.jpg", // Optional
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy_meters": 5.0
  },
  "timestamp": "2026-09-02T10:30:00Z",
  "municipality_id": "muni_san_francisco_01",
  "citizen_id": "usr_99812"
}
```

#### Response (200 OK)
```json
{
  "category": "pothole",
  "subcategory": "deep_asphalt_cavity",
  "severity": 0.85,
  "safety_risk": 0.80,
  "confidence": 0.96,
  "recommended_department": "roads",
  "visual_evidence_summary": "Deep asphalt cavity (~25cm depth) spanning active traffic lane outside hospital.",
  "hazard_tags": ["tire_puncture", "traffic_swerving", "emergency_route_hazard"],
  "estimated_urgency_hours": 4,
  "embedding": [0.0124, -0.0452, 0.0891, ...], // 768-dim float vector for pgvector
  "ai_metadata": {
    "engine": "google_gemini",
    "model": "gemini-2.0-flash",
    "latency_ms": 340,
    "offline_mode": false
  }
}
```

---

## 2. Hybrid Duplicate Incident Detection
### `POST /api/v1/ai/duplicate-check`
Combines 768-dim vector embeddings, Haversine GPS proximity, category matching, and temporal decay to detect duplicates.

#### Request Body
```json
{
  "new_description": "Car wheel hit big hole on Market & 5th.",
  "new_category": "pothole",
  "new_location": {
    "latitude": 37.7750,
    "longitude": -122.4195
  },
  "new_timestamp": "2026-09-02T11:00:00Z",
  "new_embedding": [0.0124, -0.0452, ...],
  "candidate_cases": [
    {
      "case_id": "case_1024",
      "category": "pothole",
      "description": "Deep pothole in center lane near 5th and Market.",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "timestamp": "2026-09-02T08:00:00Z",
      "status": "OPEN",
      "report_count": 3
    }
  ]
}
```

#### Response (200 OK)
```json
{
  "has_duplicate": true,
  "recommended_action": "LINK_TO_EXISTING_CASE",
  "top_match": {
    "case_id": "case_1024",
    "duplicate_probability": 0.884,
    "vector_similarity": 0.912,
    "gps_distance_meters": 14.2,
    "category_match": true,
    "time_delta_days": 0.125,
    "is_definite_duplicate": true,
    "is_potential_duplicate": true,
    "rationale": "Strong duplicate match (88.4%): Located 14.2m away with 0.91 textual semantic similarity in category 'pothole'."
  },
  "all_matches": [...]
}
```

---

## 3. Deterministic Priority Calculation
### `POST /api/v1/ai/priority-score`
Executes authoritative 100-point deterministic rubric.

#### Request Body
```json
{
  "severity": 0.85,
  "safety_risk": 0.80,
  "linked_report_count": 4,
  "zone_type": "critical_facility",
  "complaint_age_hours": 6.0,
  "sla_target_hours": 24.0,
  "public_impact_multiplier": 0.8
}
```

#### Response (200 OK)
```json
{
  "total_score": 88.0,
  "priority_level": "CRITICAL",
  "breakdown": {
    "severity_points": 25.5,
    "safety_risk_points": 16.0,
    "report_count_points": 16.0,
    "location_importance_points": 10.0,
    "complaint_age_points": 2.5,
    "public_impact_points": 8.0
  },
  "recommended_sla_hours": 4,
  "escalation_flag": true,
  "explanation": "Case prioritized as CRITICAL (88.0/100)..."
}
```

---

## 4. Fake / Spam Risk Assessment
### `POST /api/v1/ai/risk-assessment`
Non-binary risk scoring based on frequency, credibility, and AI image-text consistency.

#### Request Body
```json
{
  "citizen_id": "usr_99812",
  "submissions_last_24h": 2,
  "user_historical_verified_count": 5,
  "user_historical_rejected_count": 0,
  "has_image": true,
  "image_text_consistency_score": 0.92,
  "gps_implausible_speed_flag": false,
  "repeated_image_hash_flag": false,
  "text_spam_suspicion_score": 0.0
}
```

#### Response (200 OK)
```json
{
  "risk_score": 0,
  "risk_level": "LOW",
  "action": "NORMAL_PROCESSING",
  "flagged_factors": [],
  "is_held_for_review": false,
  "explanation": "Normal risk score: 0/100 (LOW). Report cleared for standard municipal processing."
}
```

---

## 5. Hotspots & Spatial Clustering
### `POST /api/v1/ai/hotspots`
#### Response (200 OK)
```json
{
  "total_hotspots": 2,
  "hotspots": [
    {
      "cluster_id": "hotspot_flooding_1",
      "category": "flooding",
      "center_location": {
        "latitude": 37.7752,
        "longitude": -122.4192
      },
      "radius_meters": 115.4,
      "incident_count": 6,
      "average_severity": 0.88,
      "critical_incident_count": 5,
      "municipality_id": "muni_san_francisco_01",
      "incident_ids": ["inc_1", "inc_2", "inc_3", "inc_4", "inc_5", "inc_6"],
      "label": "Flooding Hotspot: 6 reports within 115m radius"
    }
  ],
  "generated_at": "2026-09-02T12:00:00Z"
}
```

---

## 6. Recurring Problems & Root Cause Analysis
### `POST /api/v1/ai/recurring-problems`
#### Response (200 OK)
```json
{
  "total_detected": 1,
  "recurring_problems": [
    {
      "problem_id": "rec_prob_pothole_1",
      "location_label": "Recurring Pothole Zone #1",
      "center_location": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "category": "pothole",
      "total_occurrences": 5,
      "time_span_days": 120,
      "monthly_frequency": {
        "Jan 2026": 1,
        "Feb 2026": 2,
        "Mar 2026": 2
      },
      "severity_trend": "INCREASING",
      "probable_root_cause": "Sub-surface stormwater pipe leak washing away gravel foundation beneath pavement.",
      "ai_recommendation": "Execute full depth asphalt reconstruction with polymer-modified bitumen and repair underlying conduit.",
      "estimated_intervention_scope": "INFRASTRUCTURE_UPGRADE"
    }
  ],
  "summary": "Detected 1 recurring civic problem cluster across Metropolitan District."
}
```
