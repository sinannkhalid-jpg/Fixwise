# Fixwise — AI-Powered Citizen Complaint Management & Civic Intelligence Platform

REPORT → UNDERSTAND → DETECT DUPLICATES → PRIORITIZE → ROUTE → ASSIGN → UPDATE STATUS
→ RESOLVE → VERIFY → ANALYZE → PREDICT → PREVENT

## Monorepo layout

```
Fixwise/
├── apps/
│   ├── web/          # Next.js frontend — Member 2 (THIS BRANCH: feature/frontend)
│   └── api/          # FastAPI backend — Member 1 (stub)
├── services/
│   └── ai/           # Gemma/Gemini AI service — Member 3 (stub)
├── database/         # Supabase migrations/schema — Member 1 (stub)
├── shared/           # Shared types & contracts (planned)
├── docs/             # Architecture, API contract, design system
└── .github/          # CI
```

## Quick start (frontend, works standalone with mock data)

```bash
cd apps/web
npm install
npm run dev        # http://localhost:3000
```

The frontend runs **fully on mock data** (deterministic seed) so Member 2 can build all
UI before Members 1 & 3 land their services. See `docs/api-contract.md` for the seam
where mock data is swapped for the real API.

## Demo personas (role switcher in the top bar)

| Persona | Role | Scope |
|---|---|---|
| Ananya Sharma | CITIZEN | Own reports only |
| Rahul Kulkarni | MUNICIPALITY_ADMIN | Pune Municipal Corporation |
| Sneha Patil | DEPARTMENT_ADMIN | PCMC — Sanitation |
| Meera Deshpande | SUPER_ADMIN | Entire platform |

## Roles & surfaces

- **Citizen** → `/`, `/report`, `/reports`, `/reports/[id]`, `/profile`
- **Super Admin** → `/admin/*` (global dashboards, municipalities, map, analytics, recurring problems)
- **Municipality / Department Admin** → `/municipality/*` (cases, workers, assignments, SLA,
  evidence, verification, analytics, map, recurring problems, AI insights)
- **Field Worker** → *no separate UI*. Workers are records managed from the Municipality
  Dashboard (`/municipality/workers`), assigned to cases by authorized staff.

## Git workflow

Nobody pushes to `main`. Branches: `feature/frontend`, `feature/backend`, `feature/ai`.
PR → review → merge. Commits: `feat: add citizen report wizard`, `fix: correct SLA badge logic`.

## Docs

- `docs/architecture.md` — system architecture & what is mocked
- `docs/api-contract.md` — REST contract the frontend expects from Member 1 + AI JSON shapes (Member 3)
- `docs/design-system.md` — colors, badges, components, UX rules
