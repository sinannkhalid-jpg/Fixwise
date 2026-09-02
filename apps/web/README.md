# @fixwise/web — Frontend & Dashboards (Member 2)

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS. Runs fully on
**deterministic mock data** — no backend needed. When the API lands, only
`src/lib/store.tsx` action bodies change (see `docs/api-contract.md`).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Demo personas (top-right switcher or /login)

| Persona | Role | Sees |
|---|---|---|
| Ananya Sharma | CITIZEN | `/` `/report` `/reports` `/reports/[id]` `/profile` |
| Rahul Kulkarni | MUNICIPALITY_ADMIN | `/municipality/*` (PMC) |
| Sneha Patil | DEPARTMENT_ADMIN | `/municipality/*` (PCMC · Sanitation scope) |
| Meera Deshpande | SUPER_ADMIN | `/admin/*` |

## Routes

```
Citizen          /  /report  /reports  /reports/[id]  /profile  /login  /register
Main Admin       /admin  /admin/reports  /admin/municipalities  /admin/analytics
                 /admin/map  /admin/recurring-problems
Municipality     /municipality  …/reports  …/cases  …/cases/[id]  …/departments
                 …/workers  …/sla  …/map  …/analytics  …/recurring-problems
                 …/ai-insights
```

There is **no worker UI** — workers are managed in `/municipality/workers` and assigned
from the case page, per the master prompt.

## Source map

```
src/lib/types.ts        domain types (mirror of the API contract)
src/lib/constants.ts    status machine, priority engine, SLA policy, risk bands
src/lib/mock/data.ts    seeded mock DB (3 municipalities · 72 cases · 4 months)
src/lib/store.tsx       mock backend — actions mirror REST endpoints 1:1
src/lib/selectors.ts    all analytics aggregations
src/lib/personas.ts     demo auth personas (→ Supabase Auth later)
src/components/         ui/ charts/ map/ case/ shells + CaseDetail, MapExplorer,
                        ReportsTable, RecurringProblemCard
```

## Implemented platform rules (frontend mirrors backend)

- Status machine with legal transitions only; RESOLVED requires AFTER-evidence;
  failed verification → REJECTED → REOPENED → IN_PROGRESS; CLOSED can reopen.
- Priority = deterministic score (severity 30 · safety 20 · reports 20 · location 10 ·
  age 10 · impact 10) → CRITICAL/HIGH/MEDIUM/LOW → SLA 4h/24h/72h/168h.
- Duplicate reports link into existing cases (never rejected) and raise priority.
- Risk is a score with policy actions (NORMAL → ADDITIONAL_VERIFICATION →
  MANUAL_REVIEW → HOLD); nothing is auto-rejected.
- RBAC: actions gated by persona role + municipality/department scope, mirroring RLS.

## Integration seams (swap when Members 1 & 3 ship)

1. `store.tsx` → replace mutation bodies with `fetch(NEXT_PUBLIC_API_URL + ...)`
2. `personas.ts` → Supabase session (`supabase.auth.getUser()`)
3. `mock/data.ts` → delete; hydrate store from API
4. `SchematicMap` → Leaflet/MapLibre when a basemap is chosen
5. File previews (data URLs) → Supabase Storage upload paths
