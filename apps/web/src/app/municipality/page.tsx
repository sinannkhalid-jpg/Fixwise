"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { LineChart, Donut } from "@/components/charts";
import { StatusBadge } from "@/components/case";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { InfoNote, ProgressBar } from "@/components/ui/Misc";
import { PRIORITY_META } from "@/lib/constants";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { canManageCases } from "@/lib/personas";
import {
  categoryDist,
  criticalCases,
  globalStats,
  monthlyReports,
  slaSummary,
} from "@/lib/selectors";
import { useApp } from "@/lib/store";

export default function MunicipalityOverview() {
  const db = useApp();
  const { activeMunicipalityId: mid, persona, cases } = db;
  const scoped = cases.filter((c) => c.municipalityId === mid);
  const stats = globalStats(scoped);
  const sla = slaSummary(scoped);
  const trend = monthlyReports(scoped);
  const cats = categoryDist(scoped).slice(0, 5);
  const critical = criticalCases(cases, mid, 5);
  const atRisk = scoped
    .filter((c) => c.sla.status === "AT_RISK" || c.sla.status === "BREACHED")
    .filter((c) => !["CLOSED", "REJECTED"].includes(c.status))
    .slice(0, 4);
  const canManage = canManageCases(persona);

  return (
    <div className="space-y-6">
      {!canManage && (
        <InfoNote tone="amber">
          Viewing as <strong>{persona.label}</strong> — read-only. Switch to a Municipality or Department admin
          persona (top right) to assign workers, change statuses and verify cases.
        </InfoNote>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open cases" value={stats.open} sub={`${stats.critical} critical active`} icon={ClipboardList} tone="blue" />
        <StatCard label="Resolved & closed" value={stats.closed} sub={`${Math.round(stats.resolutionRate * 100)}% of all cases`} icon={CheckCircle2} tone="emerald" />
        <StatCard label="SLA compliance" value={`${Math.round(sla.compliance * 100)}%`} sub={`${sla.breached} breached · ${sla.atRisk} at risk`} icon={Timer} tone={sla.compliance > 0.8 ? "emerald" : "amber"} />
        <StatCard label="Avg resolution" value={stats.avgResolutionHours ? `${Math.round(stats.avgResolutionHours)}h` : "—"} sub={`citizen rating ${stats.satisfaction.toFixed(1)}/5`} icon={Clock} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Reports & resolutions" subtitle="last 6 months" icon={TrendingUp} />
          <div className="px-4 py-4">
            <LineChart
              labels={trend.map((t) => t.month)}
              series={[
                { name: "Reports", color: "#2563eb", values: trend.map((t) => t.count) },
                { name: "Closed", color: "#10b981", values: trend.map((t) => t.resolved) },
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Top categories" subtitle="where the workload is" icon={ClipboardList} />
          <div className="px-4 py-6">
            <Donut data={cats} centerValue={stats.total} centerLabel="cases" />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Critical — act now"
            subtitle="highest priority scores, active"
            icon={AlertTriangle}
            actions={<Link href="/municipality/cases?priority=CRITICAL" className="text-xs font-semibold text-blue-600 hover:underline">All cases →</Link>}
          />
          <div className="divide-y divide-slate-100">
            {critical.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No critical cases — nice.</p>}
            {critical.map((c) => (
              <Link key={c.id} href={`/municipality/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-sm font-bold text-rose-600">
                  {c.priorityScore.total}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">#{c.caseNumber} · {c.title}</p>
                  <p className="text-xs text-slate-400">
                    {c.location.label} · {c.assignment ? c.assignment.workerName : "unassigned"} · {fmtRelative(c.createdAt, MOCK_NOW)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="SLA watchlist" subtitle="at risk or breached" icon={Timer} actions={<Link href="/municipality/sla" className="text-xs font-semibold text-blue-600 hover:underline">SLA monitor →</Link>} />
          <div className="divide-y divide-slate-100">
            {atRisk.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">Everything on track.</p>}
            {atRisk.map((c) => {
              const total = c.sla.hoursAllowed;
              const left = (new Date(c.sla.dueAt).getTime() - MOCK_NOW.getTime()) / 3600000;
              const frac = Math.max(0, Math.min(1, left / total));
              return (
                <Link key={c.id} href={`/municipality/cases/${c.id}`} className="block px-5 py-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-slate-900">#{c.caseNumber} · {c.title}</p>
                    <Badge className={c.sla.status === "BREACHED" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                      {c.sla.status === "BREACHED" ? "breached" : "at risk"}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={frac} className={frac <= 0 ? "bg-rose-500" : "bg-amber-500"} height="h-1.5" />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {left > 0 ? `${Math.round(left)}h of ${total}h left` : `overdue by ${Math.abs(Math.round(left))}h`} · priority {c.priority}
                  </p>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Latest AI insights" subtitle="civic intelligence for this municipality" icon={Sparkles} />
        <div className="divide-y divide-slate-100">
          {db.insights
            .filter((i) => i.municipalityId === mid)
            .slice(0, 3)
            .map((i) => (
              <div key={i.id} className="flex gap-4 px-5 py-4">
                <Badge className="mt-0.5 shrink-0 border-violet-200 bg-violet-50 text-violet-700">
                  {i.type.replaceAll("_", " ").toLowerCase()}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{i.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{i.body}</p>
                </div>
                <Link href="/municipality/ai-insights" className="shrink-0 self-center text-slate-300 hover:text-blue-600">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
