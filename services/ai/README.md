<<<<<<< HEAD
# services/ai — AI & Intelligence (Member 3: feature/ai)

Owns: Gemma/Gemini integration, prompt engineering, structured JSON classification
(category, severity, safety_risk, confidence, recommended_department), embeddings +
pgvector duplicate detection, spam/fake risk scoring, hotspot detection, recurring
problem detection, root-cause analysis, recommendations, intelligence analytics APIs.

Contract: `docs/api-contract.md` (AI JSON shapes). AI is advisory only — it never writes
to the database; the backend consumes its JSON and stays authoritative for priority,
routing and status.
=======
# Civic AI & Intelligence Microservice
**Project:** AI-Powered Citizen Complaint Management & Civic Intelligence Platform  
**Owner:** Member 3 — AI & Intelligence Lead

---

## 🌟 Capabilities

- 🔍 **Multimodal Intake Analysis:** Google Gemini 2.0 / Gemma classification into 10 civic categories, severity ($0.0-1.0$), safety hazard ($0.0-1.0$), confidence, and recommended department.
- 🎯 **Hybrid Duplicate Detection:** Blends 768-dim vector embeddings (`pgvector`), Haversine GPS distance, category matching, and temporal decay into an explainable duplicate probability score.
- ⚖️ **Deterministic 100-Point Priority Engine:** Implements the authoritative municipal scoring formula (Severity: 30, Safety: 20, Report Density: 20, Zone Criticality: 10, Age: 10, Impact: 10).
- 🛡️ **Multi-Factor Fake & Spam Risk Engine:** Evaluates velocity, user credibility, and image-text consistency without binary rejection.
- 🗺️ **Spatio-Temporal Hotspot Clustering:** Detects geographic complaint hotspots for interactive map layers.
- 🔄 **Recurring Problem Detection & AI Root Cause:** Aggregates chronic localized failures and produces engineering mitigation plans for municipal decision-support.
- 🛡️ **Zero-Blocker Fallback Engine:** Automatic heuristic fallback ensures Member 1 & 2 never encounter downtime if Gemini API is unconfigured or rate-limited.

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your `GEMINI_API_KEY` (if available). If left empty, the service automatically uses its deterministic heuristic fallback engine.

### 3. Run the Service
```bash
python main.py
```
Or with Uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Interactive Documentation
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`
- **Health Check:** `http://localhost:8000/health`

---

## 🧪 Run Automated Tests

```bash
pytest
```
To run specific test modules:
```bash
pytest app/tests/test_classifier.py
pytest app/tests/test_duplicates.py
pytest app/tests/test_priority.py
pytest app/tests/test_risk.py
pytest app/tests/test_hotspots.py
pytest app/tests/test_end_to_end.py
```
>>>>>>> 26f67bc (feat(ai): add multimodal classification, pgvector duplicate detection, priority engine & civic intelligence service)
