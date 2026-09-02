import type {
  CaseStatus,
  Category,
  DepartmentKey,
  Priority,
  RiskAction,
  RiskLevel,
} from "./types";

// ── Categories ───────────────────────────────────────────────
// Icon names come from lucide-react; keep full class strings so Tailwind sees them.

export interface CategoryMeta {
  key: Category;
  label: string;
  dept: DepartmentKey;
  icon: string; // lucide icon name (display mapping in components/icons)
  chip: string; // tailwind classes for chips
  dot: string;
  bar: string; // chart color (hex for SVG)
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "POTHOLE", label: "Pothole", dept: "roads", icon: "CircleDot", chip: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500", bar: "#f59e0b" },
  { key: "ROAD_DAMAGE", label: "Damaged road", dept: "roads", icon: "Construction", chip: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500", bar: "#f97316" },
  { key: "FLOODING", label: "Flooding", dept: "drainage", icon: "Waves", chip: "bg-sky-100 text-sky-800 border-sky-200", dot: "bg-sky-500", bar: "#0ea5e9" },
  { key: "DRAINAGE", label: "Drainage", dept: "drainage", icon: "CloudRain", chip: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-500", bar: "#6366f1" },
  { key: "GARBAGE", label: "Garbage", dept: "sanitation", icon: "Trash2", chip: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-500", bar: "#64748b" },
  { key: "STREETLIGHT", label: "Streetlight", dept: "electrical", icon: "Lightbulb", chip: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500", bar: "#eab308" },
  { key: "WATER_LEAK", label: "Water leak", dept: "water", icon: "Droplets", chip: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500", bar: "#3b82f6" },
  { key: "TRAFFIC_SIGNAGE", label: "Traffic / signage", dept: "traffic", icon: "TrafficCone", chip: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500", bar: "#f43f5e" },
  { key: "INFRASTRUCTURE", label: "Public infrastructure", dept: "infrastructure", icon: "Building2", chip: "bg-teal-100 text-teal-800 border-teal-200", dot: "bg-teal-500", bar: "#14b8a6" },
  { key: "OTHER", label: "Other", dept: "infrastructure", icon: "CircleHelp", chip: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400", bar: "#94a3b8" },
];

export const CATEGORY_MAP: Record<Category, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<Category, CategoryMeta>;

export const DEPT_FOR_CATEGORY: Record<Category, DepartmentKey> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.dept])
) as Record<Category, DepartmentKey>;

// ── Departments ──────────────────────────────────────────────

export const DEPARTMENTS: Record<
  DepartmentKey,
  { name: string; icon: string; color: string }
> = {
  roads: { name: "Roads", icon: "Construction", color: "#f97316" },
  water: { name: "Water", icon: "Droplets", color: "#3b82f6" },
  electrical: { name: "Electrical", icon: "Lightbulb", color: "#eab308" },
  sanitation: { name: "Sanitation", icon: "Trash2", color: "#64748b" },
  drainage: { name: "Drainage", icon: "Waves", color: "#0ea5e9" },
  traffic: { name: "Traffic", icon: "TrafficCone", color: "#f43f5e" },
  infrastructure: { name: "Parks & Infrastructure", icon: "Building2", color: "#14b8a6" },
};

// ── Status machine (mirror of backend rules — master prompt §5) ──

export const MAIN_FLOW: CaseStatus[] = [
  "REPORTED",
  "ANALYZING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "VERIFICATION",
  "CLOSED",
];

export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  REPORTED: ["ANALYZING"],
  ANALYZING: ["ASSIGNED"],
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["VERIFICATION"],
  VERIFICATION: ["CLOSED", "REJECTED"],
  REJECTED: ["REOPENED"],
  REOPENED: ["IN_PROGRESS"],
  CLOSED: ["REOPENED"],
};

export const STATUS_META: Record<
  CaseStatus,
  { label: string; badge: string; dot: string; step: number; help: string }
> = {
  REPORTED: { label: "Reported", badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-500", step: 0, help: "Report received from a citizen" },
  ANALYZING: { label: "AI analyzing", badge: "bg-violet-100 text-violet-700 border-violet-200", dot: "bg-violet-500", step: 1, help: "Classification, severity, duplicate check" },
  ASSIGNED: { label: "Assigned", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", step: 2, help: "Routed to municipality & department" },
  IN_PROGRESS: { label: "In progress", badge: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500", step: 3, help: "Field work underway" },
  RESOLVED: { label: "Resolved", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", step: 4, help: "Work completed, evidence attached" },
  VERIFICATION: { label: "Verification", badge: "bg-cyan-100 text-cyan-700 border-cyan-200", dot: "bg-cyan-500", step: 5, help: "Municipality reviewing the evidence" },
  CLOSED: { label: "Closed", badge: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-600", step: 6, help: "Verified and closed" },
  REJECTED: { label: "Rejected", badge: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500", step: 5, help: "Verification failed" },
  REOPENED: { label: "Reopened", badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500", step: 3, help: "Reopened for rework" },
};

export const ACTIVE_STATUSES: CaseStatus[] = [
  "REPORTED",
  "ANALYZING",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "VERIFICATION",
  "REOPENED",
];

// ── Priority (deterministic, backend-owned; mirrored for display) ──

export const PRIORITY_META: Record<
  Priority,
  { label: string; badge: string; bar: string; hex: string }
> = {
  CRITICAL: { label: "Critical", badge: "bg-rose-100 text-rose-700 border-rose-200", bar: "bg-rose-500", hex: "#f43f5e" },
  HIGH: { label: "High", badge: "bg-orange-100 text-orange-700 border-orange-200", bar: "bg-orange-500", hex: "#f97316" },
  MEDIUM: { label: "Medium", badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500", hex: "#f59e0b" },
  LOW: { label: "Low", badge: "bg-slate-100 text-slate-600 border-slate-200", bar: "bg-slate-400", hex: "#94a3b8" },
};

export const PRIORITY_SLA_HOURS: Record<Priority, number> = {
  CRITICAL: 4,
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

export function priorityFromScore(total: number): Priority {
  if (total >= 80) return "CRITICAL";
  if (total >= 60) return "HIGH";
  if (total >= 40) return "MEDIUM";
  return "LOW";
}

export interface PriorityInput {
  severity: number; // 0–1
  safetyRisk: number; // 0–1
  linkedReports: number;
  locationImportance: number; // 0–10
  ageDays: number;
  publicImpact: number; // 0–10
}

export function computePriorityScore(i: PriorityInput) {
  const severity = Math.round(i.severity * 30);
  const safetyRisk = Math.round(i.safetyRisk * 20);
  const reportCount = Math.min(20, Math.max(0, (i.linkedReports - 1) * 5));
  const complaintAge = Math.min(10, Math.round(i.ageDays / 6));
  const total = Math.min(
    100,
    severity + safetyRisk + reportCount + i.locationImportance + complaintAge + i.publicImpact
  );
  return {
    severity,
    safetyRisk,
    reportCount,
    locationImportance: i.locationImportance,
    complaintAge,
    publicImpact: i.publicImpact,
    total,
  };
}

// ── Risk (master prompt §10) ─────────────────────────────────

export const RISK_META: Record<RiskLevel, { label: string; badge: string; hex: string }> = {
  LOW: { label: "Low risk", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", hex: "#10b981" },
  MEDIUM: { label: "Medium risk", badge: "bg-amber-100 text-amber-700 border-amber-200", hex: "#f59e0b" },
  HIGH: { label: "High risk", badge: "bg-orange-100 text-orange-700 border-orange-200", hex: "#f97316" },
  VERY_HIGH: { label: "Very high risk", badge: "bg-rose-100 text-rose-700 border-rose-200", hex: "#f43f5e" },
};

export const RISK_ACTION_LABEL: Record<RiskAction, string> = {
  NORMAL: "Normal processing",
  ADDITIONAL_VERIFICATION: "Additional verification",
  MANUAL_REVIEW: "Manual review required",
  HOLD: "Hold / restricted",
};

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "VERY_HIGH";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}

export function riskActionFromLevel(level: RiskLevel): RiskAction {
  switch (level) {
    case "LOW": return "NORMAL";
    case "MEDIUM": return "ADDITIONAL_VERIFICATION";
    case "HIGH": return "MANUAL_REVIEW";
    case "VERY_HIGH": return "HOLD";
  }
}

// ── Misc helpers ─────────────────────────────────────────────

export const MUNICIPALITY_LABEL: Record<string, string> = {}; // filled by data module

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
