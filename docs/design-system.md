# Design System — Fixwise Web

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS. No UI kit — a small
in-house component library (`src/components/ui`) keeps the bundle light and the look
consistent. Charts and maps are hand-rolled SVG (no external deps, works offline).

## Principles

1. **Simple for citizens** — reporting takes ≤ 3 steps. No jargon.
2. **Information-rich for admins** — density, filters, status/priority/SLA always visible.
3. **AI is advisory, visibly.** AI cards are labeled and note "final decisions by staff".
4. Responsive & accessible: semantic buttons, labels, focus rings, color + text (never
   color alone) for status.

## Semantic colors

| Token | Classes | Used for |
|---|---|---|
| Primary | `blue-600/700` | actions, links, active nav |
| Accent | `teal-500` | highlights, success sparkles |
| Surface | `white` / `slate-50` | cards / page bg |
| Sidebar | `slate-900/800` | dashboard chrome |

Status badges — REPORTED `slate` · ANALYZING `violet` · ASSIGNED `blue` · IN_PROGRESS `amber`
· RESOLVED `emerald` · VERIFICATION `cyan` · CLOSED `green-800` · REJECTED `rose` · REOPENED `orange`.

Priority — CRITICAL `rose` · HIGH `orange` · MEDIUM `amber` · LOW `slate`.
Risk — LOW `emerald` · MEDIUM `amber` · HIGH `orange` · VERY HIGH `rose`.
SLA — ON TRACK `emerald` · AT RISK `amber` · BREACHED `rose`.

## Components (`src/components`)

- `ui/` — Button, Badge, Card, StatCard, Field, Input, Textarea, Select, Modal, Tabs,
  ProgressBar, EmptyState, SectionHeader, Table primitives
- `charts/` — LineChart, BarChart, HBars, Donut, Sparkline (pure SVG)
- `map/SchematicMap` — dependency-free schematic map: case pins, hotspots, legend
- `case/` — StatusBadge, PriorityBadge, RiskBadge, SLABadge, CategoryChip, StatusStepper,
  Timeline, AICard, PriorityCard, RiskCard, LinkedReports, EvidenceGallery,
  AssignmentCard, VerificationCard, CaseDetail (shared citizen/municipality view)
- `layout/` — CitizenHeader, Footer, DashboardShell (sidebar + topbar + role switcher +
  notifications bell)

## Map & charts

The schematic map projects lat/lng to an SVG canvas with decorative roads/river — it
stands in for Leaflet/MapLibre; swap `SchematicMap` for a real tile map when the
platform picks a basemap provider. All chart data is aggregated in `lib/selectors.ts`.
