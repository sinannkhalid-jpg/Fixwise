# 3-Member Coordination & Vertical Slice Workflow Guide
**AI-Powered Citizen Complaint Management & Civic Intelligence Platform**

---

## 👥 The 3-Member Work Split

| Member | Domain & Ownership | Primary Tech Stack |
| :--- | :--- | :--- |
| **Member 1** | **Backend, Supabase & Core Platform**<br>• Supabase & PostgreSQL schema, PostGIS, pgvector<br>• Auth, RBAC, Row-Level Security (RLS)<br>• Incident / Case management APIs, SLA tracking<br>• Status state machine, assignment & verification backend | FastAPI / NestJS, PostgreSQL, Supabase, PostGIS, pgvector |
| **Member 2** | **Frontend & Dashboards**<br>• Citizen Portal (Home, Report Form, Case Tracking)<br>• Municipality Dashboard (Cases, Assignments, Map, SLA, Evidence)<br>• Main/Super Admin Global Dashboard (Global Map, Analytics)<br>*(Note: No separate Worker UI — managed from Municipality Dashboard)* | Next.js, React, TypeScript, Tailwind CSS, Lucide, Leaflet/Mapbox |
| **Member 3** *(You)* | **AI, Intelligence & Algorithms**<br>• Gemini 2.0 / Gemma multimodal classification<br>• 768-dim embeddings & pgvector hybrid duplicate detection<br>• Deterministic 100-point Priority Engine<br>• Fake/Spam Risk scoring & manual review flagging<br>• Hotspot detection, recurring problems & AI recommendations | Python, FastAPI, Google GenAI SDK, scikit-learn, NumPy, Pydantic |

---

## 🚀 The First Vertical Slice Workflow

```
[ Citizen (Member 2 UI) ]
         │  1. Submits Photo + GPS + Description (/report)
         ▼
[ Backend API Gateway (Member 1) ]
         │  2. Authenticates & temporarily stores report payload
         ▼
[ AI Service: POST /api/v1/ai/analyze (Member 3) ]
         │  3. Multimodal analysis -> Category, Severity, Safety Risk, Embedding (768-dim)
         ▼
[ Backend: pgvector + Proximity Query (Member 1) ]
         │  4. Finds nearby open candidate cases within 150m
         ▼
[ AI Service: POST /api/v1/ai/duplicate-check (Member 3) ]
         │  5. Calculates Duplicate Probability
         ├── IF DUPLICATE (>= 75%):
         │      Member 1 links report to existing Case (increments report_count)
         └── IF NEW CASE:
                Member 1 creates new incident record
         ▼
[ AI Service: POST /api/v1/ai/priority-score (Member 3) ]
         │  6. Computes 100-pt score, Priority Tier (CRITICAL/HIGH/MED/LOW) & SLA hours
         ▼
[ PostGIS Municipality Boundary Match (Member 1) ]
         │  7. Assigns municipality_id & routes to department
         ▼
[ Municipality Dashboard (Member 2 UI) ]
         │  8. Municipality Admin views case with AI diagnostics on map
         │  9. Admin assigns worker & changes status (ASSIGNED -> IN_PROGRESS)
         ▼
[ Resolution & Verification (Member 1 & 2) ]
         │ 10. Worker performs repair, evidence uploaded via Municipality UI
         │ 11. Admin verifies and marks CLOSED
         ▼
[ Civic Intelligence (Member 3 Analytics) ]
           12. System clusters resolved/open issues -> Hotspots & Recurring Root Causes
```

---

## 🛠️ How Team Members Test Today

1. **Member 2 (Frontend)**:
   - Use `docs/SAMPLE_PAYLOADS.json` for mock state while building Next.js components.
   - Run AI service on `http://localhost:8000` to test live AI classification and priority calculation in forms.

2. **Member 1 (Backend)**:
   - Follow `docs/PGVECTOR_POSTGIS_GUIDE.md` to set up Supabase tables, PostGIS indexes, and pgvector cosine distance functions.
   - Call Member 3's REST endpoints (`POST /api/v1/ai/analyze`, `POST /api/v1/ai/duplicate-check`, `POST /api/v1/ai/priority-score`) during incident creation.

3. **Member 3 (AI Service)**:
   - Service is fully self-contained with offline fallback heuristic and Gemini API connectors.
   - Run unit tests with `pytest`.
