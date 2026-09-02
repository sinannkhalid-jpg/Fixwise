import { AlertTriangle, Bot, Camera, Clock, Info, ShieldAlert, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/icons";
import { InfoNote, ProgressBar } from "@/components/ui/Misc";
import {
  CATEGORY_MAP,
  MAIN_FLOW,
  PRIORITY_META,
  RISK_ACTION_LABEL,
  RISK_META,
  STATUS_META,
} from "@/lib/constants";
import { fmtDateTime, fmtRelative, fmtHours, hoursUntil } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import type { Case, CaseStatus, LinkedReport } from "@/lib/types";

// ── badges ───────────────────────────────────────────────────

export function StatusBadge({ status }: { status: CaseStatus }) {
  const m = STATUS_META[status];
  return (
    <Badge className={m.badge} dot={m.dot}>
      {m.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Case["priority"] }) {
  const m = PRIORITY_META[priority];
  return (
    <Badge className={m.badge}>
      {m.label}
    </Badge>
  );
}

export function RiskBadge({ level }: { level: Case["risk"]["level"] }) {
  const m = RISK_META[level];
  return (
    <Badge className={m.badge}>
      {m.label}
    </Badge>
  );
}

export function SLABadge({ c }: { c: Case }) {
  const done = ["MET", "BREACHED"].includes(c.sla.status);
  const cls =
    c.sla.status === "BREACHED"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : c.sla.status === "AT_RISK"
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : c.sla.status === "MET"
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const label =
    c.sla.status === "BREACHED"
      ? done && c.status === "CLOSED" ? "SLA breached" : "SLA breached"
      : c.sla.status === "AT_RISK"
        ? `SLA at risk · ${fmtHours(hoursUntil(c.sla.dueAt, MOCK_NOW))} left`
        : c.sla.status === "MET"
          ? "SLA met"
          : `${fmtHours(hoursUntil(c.sla.dueAt, MOCK_NOW))} to SLA`;
  return (
    <Badge className={cls}>
      <Clock className="h-3 w-3" aria-hidden />
      {label}
    </Badge>
  );
}

export function CategoryChip({ category }: { category: Case["category"] }) {
  const m = CATEGORY_MAP[category];
  return (
    <Badge className={m.chip}>
      <Icon name={m.icon} className="h-3 w-3" />
      {m.label}
    </Badge>
  );
}

// ── status stepper (state machine) ───────────────────────────

export function StatusStepper({ status }: { status: CaseStatus }) {
  const cur = STATUS_META[status].step;
  const isFail = status === "REJECTED" || status === "REOPENED";
  return (
    <div>
      <div className="flex items-center">
        {MAIN_FLOW.map((s, i) => {
          const done = i < cur || (i === MAIN_FLOW.length - 1 && status === "CLOSED");
          const active = i === cur;
          const m = STATUS_META[s];
          return (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors ${
                    active
                      ? isFail
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-blue-600 bg-blue-600 text-white"
                      : done
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 bg-white text-slate-400"
                  }`}
                  title={m.help}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={`w-16 text-center text-[10px] leading-tight ${
                    active ? "font-semibold text-slate-900" : done ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  {m.label}
                </span>
              </div>
              {i < MAIN_FLOW.length - 1 && (
                <div className={`mx-1 mb-5 h-0.5 flex-1 rounded ${i < cur ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      {isFail && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          Verification failed — case {status === "REJECTED" ? "rejected and" : ""} reopened for rework, now back at{" "}
          <strong>in progress</strong>.
        </p>
      )}
    </div>
  );
}

// ── timeline ─────────────────────────────────────────────────

export function Timeline({ history }: { history: Case["statusHistory"] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-slate-100 pl-5">
      {[...history].reverse().map((e, i) => {
        const m = STATUS_META[e.status];
        return (
          <li key={i} className="relative">
            <span className={`absolute -left-[27px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${m.dot}`} />
            <div className="flex flex-wrap items-baseline gap-x-2">
              <p className="text-sm font-semibold text-slate-900">{m.label}</p>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badgeForRole(e.byRole)}`}>
                {e.byRole.replaceAll("_", " ")}
              </span>
              <span className="text-xs text-slate-400">
                {fmtDateTime(e.at)} · {fmtRelative(e.at, MOCK_NOW)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              by {e.byName}
              {e.note ? ` — ${e.note}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function badgeForRole(role: string): string {
  if (role === "CITIZEN") return "bg-teal-50 text-teal-700";
  if (role === "SYSTEM") return "bg-violet-50 text-violet-700";
  return "bg-blue-50 text-blue-700";
}

// ── AI / priority / risk cards ───────────────────────────────

export function AICard({ c }: { c: Case }) {
  const bars = [
    { label: "Severity", value: c.ai.severity },
    { label: "Safety risk", value: c.ai.safetyRisk },
    { label: "Confidence", value: c.ai.confidence },
  ];
  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <Bot className="h-4.5 w-4.5 h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI analysis</p>
            <p className="text-[11px] text-slate-500">{c.ai.model}</p>
          </div>
        </div>
        <Badge className="border-violet-200 bg-white text-violet-700">
          {Math.round(c.ai.confidence * 100)}% confidence
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">{c.ai.summary}</p>
      <div className="mt-4 space-y-2.5">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-xs text-slate-500">{b.label}</span>
            <ProgressBar value={b.value} className={b.value > 0.66 ? "bg-rose-500" : b.value > 0.4 ? "bg-amber-500" : "bg-emerald-500"} height="h-1.5" />
            <span className="w-8 text-right text-xs font-semibold text-slate-700">{Math.round(b.value * 100)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-slate-400">Classified as</p>
          <p className="mt-0.5 font-semibold text-slate-800">{CATEGORY_MAP[c.ai.category].label}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-slate-400">Recommends routing to</p>
          <p className="mt-0.5 font-semibold capitalize text-slate-800">{c.ai.recommendedDepartment}</p>
        </div>
      </div>
      <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-violet-800/80">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        AI output is advisory. Final priority, routing and status are decided by municipal staff and platform rules.
      </p>
    </div>
  );
}

export function PriorityCard({ c }: { c: Case }) {
  const rows = [
    { label: "Severity", value: c.priorityScore.severity, max: 30 },
    { label: "Safety risk", value: c.priorityScore.safetyRisk, max: 20 },
    { label: "Report count", value: c.priorityScore.reportCount, max: 20 },
    { label: "Location importance", value: c.priorityScore.locationImportance, max: 10 },
    { label: "Complaint age", value: c.priorityScore.complaintAge, max: 10 },
    { label: "Public impact", value: c.priorityScore.publicImpact, max: 10 },
  ];
  const pm = PRIORITY_META[c.priority];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Priority score</p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900">{c.priorityScore.total}</span>
          <span className="text-xs text-slate-400">/100</span>
          <PriorityBadge priority={c.priority} />
        </div>
      </div>
      <div className="mt-2">
        <ProgressBar value={c.priorityScore.total / 100} className={pm.bar} height="h-2.5" />
        <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
          <span>0</span><span>LOW &lt;40</span><span>MED &lt;60</span><span>HIGH &lt;80</span><span>CRIT 100</span>
        </div>
      </div>
      <table className="mt-4 w-full text-xs">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-50 last:border-0">
              <td className="py-1.5 text-slate-500">{r.label}</td>
              <td className="py-1.5 text-right font-semibold text-slate-700">
                {r.value}<span className="text-slate-300"> /{r.max}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[11px] text-slate-400">
        Deterministic engine (backend-owned, config-driven). AI provides inputs only.
      </p>
    </div>
  );
}

export function RiskCard({ c }: { c: Case }) {
  const m = RISK_META[c.risk.level];
  return (
    <div className={`rounded-2xl border p-5 ${c.risk.score >= 60 ? "border-rose-200 bg-rose-50/50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`h-5 w-5 ${c.risk.score >= 60 ? "text-rose-500" : "text-slate-400"}`} aria-hidden />
          <p className="text-sm font-semibold text-slate-900">Spam / fraud risk</p>
        </div>
        <RiskBadge level={c.risk.level} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={c.risk.score / 100} className={c.risk.score >= 60 ? "bg-rose-500" : c.risk.score >= 35 ? "bg-amber-500" : "bg-emerald-500"} />
        <span className="w-16 shrink-0 text-right text-sm font-bold text-slate-800">{c.risk.score}/100</span>
      </div>
      <p className="mt-3 text-xs font-medium text-slate-600">Action: {RISK_ACTION_LABEL[c.risk.action]}</p>
      {c.risk.reasons.length > 0 && (
        <ul className="mt-2 list-inside list-disc text-xs text-rose-700/90">
          {c.risk.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        Risk is a score, not a verdict — suspicious reports get extra checks, they are not auto-rejected.
      </p>
    </div>
  );
}

// ── linked reports / evidence ────────────────────────────────

export function LinkedReports({ reports }: { reports: LinkedReport[] }) {
  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Users className="h-4 w-4" aria-hidden />
        {reports.length} report{reports.length > 1 ? "s" : ""} linked · {new Set(reports.map((r) => r.citizenId)).size} unique citizen
        {new Set(reports.map((r) => r.citizenId)).size > 1 ? "s" : ""}
      </p>
      {reports.map((r, i) => (
        <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
              <User className="h-3 w-3" aria-hidden />
            </span>
            <span className="text-sm font-medium text-slate-800">{r.citizenName}</span>
            {i === 0 && <Badge className="border-teal-200 bg-teal-50 text-teal-700">primary report</Badge>}
            {r.riskScore >= 35 && (
              <Badge className={RISK_META[r.riskLevel].badge}>risk {r.riskScore}</Badge>
            )}
            <span className="ml-auto text-xs text-slate-400">{fmtRelative(r.createdAt, MOCK_NOW)}</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{r.description}</p>
          {r.hasPhoto && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
              <Camera className="h-3 w-3" aria-hidden /> photo attached
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function PhotoTile({
  category,
  label = "Evidence photo",
  dataUrl,
  className = "h-40",
}: {
  category: Case["category"];
  label?: string;
  dataUrl?: string;
  className?: string;
}) {
  if (dataUrl) {
    return (
      <figure className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={label} className="h-full w-full object-cover" />
      </figure>
    );
  }
  const m = CATEGORY_MAP[category];
  return (
    <figure
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 ${className}`}
    >
      <span className={`flex h-10 w-10 items-center justify-center rounded-full border ${m.chip}`}>
        <Icon name={m.icon} className="h-5 w-5" />
      </span>
      <figcaption className="text-[11px] font-medium text-slate-400">{label}</figcaption>
    </figure>
  );
}

export function EvidenceGallery({ c }: { c: Case }) {
  if (!c.evidence.length)
    return (
      <InfoNote tone="blue">
        No evidence yet. Authorized staff attach <strong>before</strong> and <strong>after</strong> evidence from the
        Municipality Dashboard — there is no separate worker app.
      </InfoNote>
    );
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {c.evidence.map((e) => (
        <div key={e.id} className="space-y-1.5">
          <PhotoTile
            category={c.category}
            dataUrl={e.photoDataUrl}
            label={`${e.type} · ${fmtRelative(e.at, MOCK_NOW)}`}
          />
          <div>
            <Badge
              className={
                e.type === "AFTER"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : e.type === "BEFORE"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
              }
            >
              {e.type}
            </Badge>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              {e.note} — {e.byName}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
