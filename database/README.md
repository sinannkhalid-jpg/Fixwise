# database — Supabase (Member 1)

PostgreSQL + PostGIS + pgvector. Planned tables (master prompt §16):

users, municipalities, departments, workers, incidents, incident_reports, assignments,
evidence, status_history, notifications, ai_analysis, incident_embeddings,
priority_scores, risk_assessments, verifications, feedback, sla_records,
recurring_problems, recommendations, audit_logs.

RLS matrix: SUPER ADMIN → all · MUNICIPALITY ADMIN → own municipality ·
DEPARTMENT ADMIN → own department · FIELD WORKER → assigned cases · CITIZEN → own reports.

Migrations land on `feature/backend`. The frontend's domain types
(`apps/web/src/lib/types.ts`) are the source of truth for field names until the schema
merges, then both should be generated from `shared/`.
