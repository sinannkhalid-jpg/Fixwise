# API Contract — what the frontend (Member 2) expects

Base URL: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000/api/v1`). While empty,
the web app runs on its internal mock store — same shapes as below.

Auth: `Authorization: Bearer <supabase-jwt>` (set by Supabase JS client later).
Roles: `SUPER_ADMIN | MUNICIPALITY_ADMIN | DEPARTMENT_ADMIN | FIELD_WORKER | CITIZEN`.

## Endpoints

| Method | Path | Scope | Used by |
|---|---|---|---|
| POST | `/incidents` | citizen | Report wizard |
| GET | `/incidents?municipality_id&status&category&priority&dept&sla&search` | role-scoped | Reports / Cases tables |
| GET | `/incidents/:id` | role-scoped | Case detail |
| PATCH | `/incidents/:id/status` | muni/dept/super admin | Status change (validated transition) |
| POST | `/incidents/:id/evidence` | muni/dept admin | Evidence upload |
| POST | `/incidents/:id/verify` | muni admin (+dept) | Approve → CLOSED / Reject → REOPENED |
| POST | `/incidents/:id/assign` | muni/dept admin | Assign worker |
| POST | `/incidents/:id/feedback` | reporter citizen | Rating + resolution confirm |
| GET | `/municipalities` | any admin | Admin dashboards |
| GET | `/departments?municipality_id` | admin | Municipality dashboard |
| GET | `/workers?municipality_id&department_id` | admin | Workers page |
| POST | `/workers` / `PATCH /workers/:id` | muni admin | Add / activate worker |
| GET | `/analytics?municipality_id&range` | admin | Analytics pages |
| GET | `/hotspots?municipality_id&category` | admin | Maps |
| GET | `/recurring-problems?municipality_id` | admin | Recurring problems |
| GET | `/notifications` | own | Bell dropdown |
| POST | `/ai/analyze` | internal/backend | (Member 3 service) |
| POST | `/ai/duplicate-check` | internal/backend | (Member 3 service) |

## POST /incidents — request

```json
{
  "description": "Deep pothole near school gate, two-wheelers falling",
  "category_hint": "POTHOLE",
  "photo_paths": ["reports/2026/09/abc1.jpg"],
  "video_path": null,
  "location": { "lat": 18.5204, "lng": 73.8567, "label": "FC Road, Shivajinagar" },
  "occurred_at": "2026-09-02T04:00:00Z"
}
```

## POST /incidents — response (Case as rendered everywhere)

```json
{
  "id": "c-1024",
  "case_number": 1024,
  "title": "Large pothole on FC Road",
  "status": "ASSIGNED",
  "priority": "HIGH",
  "priority_score": { "severity": 25, "safety_risk": 15, "report_count": 10,
                      "location_importance": 8, "complaint_age": 2, "public_impact": 7, "total": 67 },
  "category": "POTHOLE",
  "municipality_id": "m-pmc",
  "department": "ROADS",
  "location": { "lat": 18.521, "lng": 73.857, "label": "FC Road, Shivajinagar" },
  "reporter": { "id": "u-me", "name": "Ananya Sharma" },
  "linked_reports": [{ "id": "r-1", "citizen_name": "Rohan M.", "created_at": "..." }],
  "ai_analysis": {
    "category": "pothole", "severity": 0.84, "safety_risk": 0.76,
    "confidence": 0.95, "recommended_department": "roads",
    "duplicate_of": null, "duplicate_probability": 0.31, "summary": "…"
  },
  "risk": { "score": 18, "level": "LOW", "action": "NORMAL", "reasons": [] },
  "sla": { "created_at": "…", "due_at": "…", "hours_allowed": 24,
           "breached": false, "status": "ON_TRACK" },
  "assignment": { "worker_id": "w-pmc-1", "worker_name": "Ravi Shinde", "assigned_at": "…" },
  "status_history": [{ "status": "REPORTED", "at": "…", "by_name": "Ananya Sharma", "by_role": "CITIZEN" }],
  "evidence": [{ "id": "e-1", "type": "AFTER", "note": "Filled and levelled", "at": "…" }],
  "verification": { "status": "PASSED", "method": "PHOTO", "by_name": "Rahul Kulkarni" },
  "feedback": { "rating": 5, "resolved_confirmed": true, "comment": "Fixed in a day!" },
  "created_at": "…", "updated_at": "…"
}
```

## AI service JSON (Member 3 → backend → advisory only)

Classification (`POST /ai/analyze`):
```json
{ "category": "pothole", "severity": 0.84, "safety_risk": 0.76,
  "confidence": 0.95, "recommended_department": "roads", "model": "gemini-1.5-flash" }
```

Risk (backend policy, AI-informed):
```json
{ "risk_score": 72, "risk_level": "HIGH", "action": "MANUAL_REVIEW", "reasons": ["excessive_submissions"] }
```

Duplicate check (`POST /ai/duplicate-check`):
```json
{ "case_id": "c-1024", "probability": 0.88, "signals": { "text": 0.91, "geo_km": 0.07, "age_days": 0.4 } }
```

## Priority engine (deterministic, backend-owned, config-driven)

`severity(30) + safety(20) + report_count(20) + location(10) + age(10) + impact(10) = 0–100`
→ CRITICAL ≥ 80 · HIGH ≥ 60 · MEDIUM ≥ 40 · LOW < 40.
SLA defaults: CRITICAL 4h · HIGH 24h · MEDIUM 72h · LOW 168h (configurable server-side).

## Status machine (backend must validate)

```
REPORTED → ANALYZING → ASSIGNED → IN_PROGRESS → RESOLVED → VERIFICATION → CLOSED
VERIFICATION → REJECTED → REOPENED → IN_PROGRESS        CLOSED → REOPENED
```
