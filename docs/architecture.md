# System Architecture

```
CITIZEN (Next.js)                ADMIN DASHBOARDS (Next.js)
      │ report (photo+GPS+text)       │ assign / status / evidence / verify
      └───────────────┬───────────────┘
                      ▼
              API GATEWAY  (apps/api — Member 1, FastAPI/NestJS)
              auth · RBAC · validation · rate limiting · audit
                  │                        │
                  ▼                        ▼
        SUPABASE (Postgres+PostGIS   AI SERVICE (services/ai — Member 3)
        +pgvector, Auth, Storage,    Gemma/Gemini → structured JSON
        Realtime, RLS)               embeddings · risk · insights
```

## Golden rules (from the master prompt)

1. **AI recommends, backend decides.** AI never writes to the DB. Priority, routing,
   status transitions, SLA and verification are computed/enforced by the backend.
2. **Controlled state machine** — `REPORTED → ANALYZING → ASSIGNED → IN_PROGRESS →
   RESOLVED → VERIFICATION → CLOSED`; failed verification → `REJECTED → REOPENED →
   IN_PROGRESS`. Transitions validated server-side; this frontend mirrors the same
   rules and only offers legal transitions.
3. **No worker UI.** Workers are managed from the Municipality Dashboard.
4. **If AI fails, the report survives** (`AI_STATUS = PENDING/FAILED`, retry allowed).

## What is mocked in this branch (feature/frontend)

| Concern | Mock strategy | Swap point |
|---|---|---|
| Data | Deterministic seeded generator in `apps/web/src/lib/mock/data.ts` (72 cases, 3 municipalities, 4 months of history) | `src/lib/store.tsx` actions → replace bodies with `fetch()` calls |
| Auth | Demo persona switcher (Citizen / Municipality / Department / Super admin) | `src/lib/personas.ts` → Supabase Auth session |
| AI analysis | Keyword classifier + random-but-plausible scores | `createReport()` in store → `POST /api/v1/incidents` |
| Realtime | In-memory store updates | Supabase Realtime subscriptions |
| Storage | FileReader data-URL previews | Supabase Storage buckets |

All contracts the frontend expects are documented in `api-contract.md`.

## Phases mapping (master prompt §24)

- Phase 1–2 (foundation + first vertical slice): **done in mock** — report → AI →
  priority → route → case → municipality dashboard → admin dashboard.
- Phase 3 (municipal operations): **done in mock** — departments, workers, assignment,
  status machine, SLA, evidence, verification.
- Phase 4–6 (AI intelligence): duplicate detection & risk scoring are simulated in the
  report wizard + case cards; hotspots, recurring problems and AI insights are rendered
  from mock analytics. Live once Member 3's service lands.
