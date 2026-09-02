# services/ai — AI & Intelligence (Member 3: feature/ai)

Owns: Gemma/Gemini integration, prompt engineering, structured JSON classification
(category, severity, safety_risk, confidence, recommended_department), embeddings +
pgvector duplicate detection, spam/fake risk scoring, hotspot detection, recurring
problem detection, root-cause analysis, recommendations, intelligence analytics APIs.

Contract: `docs/api-contract.md` (AI JSON shapes). AI is advisory only — it never writes
to the database; the backend consumes its JSON and stays authoritative for priority,
routing and status.
