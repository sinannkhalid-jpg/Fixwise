# apps/api — Backend (Member 1: feature/backend)

Owns: Supabase (Postgres + PostGIS + pgvector), Auth + RBAC + RLS, all REST endpoints
listed in `docs/api-contract.md`, incident/case management, status state machine,
assignments, SLA, notifications, evidence/verification workflow, storage, audit logs,
API gateway, deployment.

Suggested stack: FastAPI (Python) or NestJS (TS) — team decision.

The frontend (apps/web) runs on mock data implementing this exact contract until this
service lands. Nothing in apps/web should need UI changes at swap time — only
`src/lib/store.tsx` action bodies change from mock mutations to API calls.
