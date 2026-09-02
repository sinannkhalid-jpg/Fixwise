# Fixwise Civic AI & Intelligence Service

The AI service is advisory. It analyzes reports and returns validated JSON; it never writes directly to production data, changes case status, assigns workers, or bypasses backend authorization.

## Capabilities

- Gemini multimodal complaint classification
- Severity, safety-risk, public-impact and department recommendations
- Explainable spam/fake-risk scoring with human-review flags
- 768-dimensional embeddings and hybrid duplicate detection
- Deterministic backend priority inputs
- Geographic hotspot and recurring-problem analysis
- Root-cause hypotheses and preventive recommendations
- Offline fallback when Google AI is unavailable

## Setup

```bash
cd services/ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Configure `.env`:

```env
GEMINI_API_KEY="your-server-side-key"
GEMINI_MULTIMODAL_MODEL="gemini-3.8-flash"
GEMINI_EMBEDDING_MODEL="gemini-embedding-001"
```

Never commit `.env` or expose the key through a `NEXT_PUBLIC_` variable.

## Run

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Test

```bash
pytest -q
```

The service automatically falls back to conservative rule-based analysis. Unknown or unreadable text receives low classification confidence and is routed to human review instead of being treated as a valid high-confidence report.
