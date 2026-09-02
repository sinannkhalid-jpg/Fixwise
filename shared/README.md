# shared — cross-app contracts

Planned home for generated types + zod schemas shared between `apps/web`, `apps/api`
and `services/ai` (e.g. the `Case`, `AIAnalysis`, `RiskAssessment` shapes from
`apps/web/src/lib/types.ts` and `docs/api-contract.md`).

Until Member 1's schema lands, `apps/web/src/lib/types.ts` is the reference. Move
types here at integration time and import via workspace packages.
