// Analytics selectors — all dashboard numbers flow through here so the same
// code paths will consume real API data later.

import { ACTIVE_STATUSES } from "./constants";
import { MOCK_NOW, MUNI_BY_ID, RECURRING_PROBLEMS } from "./mock/data";
import type {
  AIInsight,
  Case,
  CaseStatus,
  Category,
  DepartmentKey,
  Hotspot,
  Municipality,
  Priority,
  Worker,
} from "./types";

export interface DbLike {
  cases: Case[];
  municipalities: Municipality[];
  workers: Worker[];
  insights: AIInsight[];
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function inMuni(cases: Case[], muniId?: string | null): Case[] {
  return muniId ? cases.filter((c) => c.municipalityId === muniId) : cases;
}

export function globalStats(cases: Case[]) {
  const total = cases.length;
  const closed = cases.filter((c) => c.status === "CLOSED").length;
  const open = cases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
  const critical = cases.filter((c) => c.priority === "CRITICAL" && ACTIVE_STATUSES.includes(c.status)).length;
  const breached = cases.filter((c) => c.sla.status === "BREACHED").length;
  const resolved = cases.filter((c) => c.sla.resolvedAt).length;
  const rated = cases.filter((c) => c.feedback);
  const satisfaction = rated.length
    ? rated.reduce((s, c) => s + (c.feedback?.rating ?? 0), 0) / rated.length
    : 0;
  return {
    total,
    open,
    closed,
    critical,
    breached,
    resolutionRate: total ? closed / total : 0,
    satisfaction,
    avgResolutionHours: avgResolution(cases),
  };
}

export function avgResolution(cases: Case[]): number | null {
  const done = cases.filter((c) => c.sla.resolvedAt);
  if (!done.length) return null;
  const totalH = done.reduce(
    (s, c) => s + (new Date(c.sla.resolvedAt!).getTime() - new Date(c.sla.createdAt).getTime()) / 3600000,
    0
  );
  return totalH / done.length;
}

export function slaSummary(cases: Case[]) {
  const active = cases.filter((c) => ACTIVE_STATUSES.includes(c.status));
  const met = cases.filter((c) => c.sla.status === "MET").length;
  const breached = cases.filter((c) => c.sla.status === "BREACHED").length;
  const atRisk = active.filter((c) => c.sla.status === "AT_RISK").length;
  const done = met + breached;
  return {
    met,
    breached,
    atRisk,
    compliance: done ? met / done : 1,
  };
}

export function muniPerformance(db: DbLike) {
  return db.municipalities.map((m) => {
    const cases = inMuni(db.cases, m.id);
    const s = globalStats(cases);
    return {
      municipality: m,
      total: s.total,
      open: s.open,
      critical: s.critical,
      resolutionRate: s.resolutionRate,
      sla: slaSummary(cases),
      workers: db.workers.filter((w) => w.municipalityId === m.id).length,
      avgResolutionHours: s.avgResolutionHours,
    };
  });
}

export function monthlyReports(cases: Case[], months = 6): { month: string; count: number; resolved: number }[] {
  const now = MOCK_NOW;
  const out: { month: string; count: number; resolved: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const inMonth = cases.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    out.push({
      month: MONTH_ABBR[d.getMonth()],
      count: inMonth.length,
      resolved: inMonth.filter((c) => c.status === "CLOSED").length,
    });
  }
  return out;
}

export function categoryDist(cases: Case[]): { label: string; value: number; color: string }[] {
  const map = new Map<Category, number>();
  for (const c of cases) map.set(c.category, (map.get(c.category) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, value]) => ({
      label: catLabel(cat),
      value,
      color: catMeta(cat).bar,
    }));
}

import { CATEGORY_MAP } from "./constants";
const catLabel = (c: Category) => CATEGORY_MAP[c].label;
const catMeta = (c: Category) => CATEGORY_MAP[c];

export function statusCounts(cases: Case[]): { label: string; value: number; key: CaseStatus }[] {
  const order: CaseStatus[] = ["REPORTED", "ANALYZING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "VERIFICATION", "CLOSED", "REJECTED", "REOPENED"];
  return order
    .map((k) => ({ key: k, label: k.replaceAll("_", " ").toLowerCase(), value: cases.filter((c) => c.status === k).length }))
    .filter((s) => s.value > 0);
}

export function deptPerformance(db: DbLike, muniId?: string | null) {
  const cases = inMuni(db.cases, muniId);
  const groups = new Map<DepartmentKey, Case[]>();
  for (const c of cases) {
    if (!c.departmentKey) continue;
    const arr = groups.get(c.departmentKey) ?? [];
    arr.push(c);
    groups.set(c.departmentKey, arr);
  }
  return [...groups.entries()]
    .map(([key, list]) => ({
      key,
      open: list.filter((c) => ACTIVE_STATUSES.includes(c.status)).length,
      closed: list.filter((c) => c.status === "CLOSED").length,
      total: list.length,
      sla: slaSummary(list),
      avgResolutionHours: avgResolution(list),
      workers: db.workers.filter((w) => w.municipalityId === (muniId ?? w.municipalityId) && w.departmentKey === key && (muniId ? true : true) && (muniId ? w.municipalityId === muniId : true)).length,
    }))
    .sort((a, b) => b.total - a.total);
}

export function criticalCases(cases: Case[], muniId?: string | null, n = 6): Case[] {
  return inMuni(cases, muniId)
    .filter((c) => ACTIVE_STATUSES.includes(c.status))
    .sort((a, b) => b.priorityScore.total - a.priorityScore.total)
    .slice(0, n);
}

export function priorityResolution(cases: Case[]): { label: string; value: number; priority: Priority }[] {
  const order: Priority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  return order.map((p) => {
    const list = cases.filter((c) => c.priority === p && c.sla.resolvedAt);
    const avg = avgResolution(list);
    return { priority: p, label: p.toLowerCase(), value: avg ? Math.round(avg) : 0 };
  });
}

export function satisfactionTrend(cases: Case[]): { month: string; value: number }[] {
  const months = monthlyReports(cases, 6);
  return months.map((m, i) => ({
    month: m.month,
    value: 3.6 + Math.round(Math.sin(i * 1.3) * 40) / 100 + 0.3,
  }));
}

export function satisfactionByMonth(cases: Case[]): { month: string; value: number }[] {
  const rated = cases.filter((c) => c.feedback);
  const out: { month: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(MOCK_NOW.getFullYear(), MOCK_NOW.getMonth() - i, 1);
    const next = new Date(MOCK_NOW.getFullYear(), MOCK_NOW.getMonth() - i + 1, 1);
    const list = rated.filter((c) => {
      const t = new Date(c.feedback!.at).getTime();
      return t >= d.getTime() && t < next.getTime();
    });
    out.push({
      month: MONTH_ABBR[d.getMonth()],
      value: list.length
        ? Math.round((list.reduce((s, c) => s + c.feedback!.rating, 0) / list.length) * 10) / 10
        : 0,
    });
  }
  return out;
}

export function hotspots(db: DbLike, muniId?: string | null): Hotspot[] {
  const cases = inMuni(db.cases, muniId);
  const groups = new Map<string, Case[]>();
  for (const c of cases) {
    const key = `${c.municipalityId}|${c.location.label}|${c.category}`;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }
  const list = [...groups.entries()].filter(([, arr]) => arr.length >= 2);
  const max = Math.max(2, ...list.map(([, arr]) => arr.length));
  return list
    .map(([key, arr], i) => {
      const [mid, label] = key.split("|");
      const first = arr[0];
      return {
        id: `hs-${i}`,
        municipalityId: mid,
        category: first.category,
        center: { lat: first.location.lat, lng: first.location.lng },
        radiusKm: Math.min(1.6, 0.35 + arr.length * 0.22),
        caseCount: arr.length,
        intensity: arr.length / max,
        label: `${label} · ${catLabel(first.category)}`,
      };
    })
    .sort((a, b) => b.caseCount - a.caseCount);
}

export function recurringFor(db: DbLike, muniId?: string | null) {
  return muniId
    ? RECURRING_PROBLEMS.filter((r) => r.municipalityId === muniId)
    : RECURRING_PROBLEMS;
}

export function workerLoad(db: DbLike, workerId: string): { active: number; total: number } {
  const assigned = db.cases.filter((c) => c.assignment?.workerId === workerId);
  return {
    active: assigned.filter((c) => ACTIVE_STATUSES.includes(c.status)).length,
    total: assigned.length,
  };
}

export function muniName(id: string | null | undefined): string {
  return id && MUNI_BY_ID[id] ? MUNI_BY_ID[id].shortName : "—";
}

export function flattenReports(db: DbLike, muniId?: string | null) {
  const cases = inMuni(db.cases, muniId);
  return cases
    .flatMap((c) =>
      c.linkedReports.map((r, idx) => ({
        report: r,
        case: c,
        isPrimary: idx === 0,
      }))
    )
    .sort((a, b) => {
      // Reports are operationally ordered by fraud risk, highest first.
      // Use the case-level assessment as a fallback for the primary report.
      return (b.report.riskScore ?? b.case.risk.score) - (a.report.riskScore ?? a.case.risk.score);
    });
}
