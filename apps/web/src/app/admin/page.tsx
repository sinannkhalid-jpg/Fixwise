"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3 as BarIcon,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Repeat,
  Sparkles,
} from "lucide-react";
import { StatusBadge } from "@/components/case";
import { LineChart, Sparkline } from "@/components/charts";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Misc";
import { PRIORITY_META } from "@/lib/constants";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { criticalCases, globalStats, monthlyReports, muniPerformance, slaSummary } from "@/lib/selectors";
import { useApp } from "@/lib/store";

export default function AdminOverview() {
  const db = useApp();
  const stats = globalStats(db.cases);
  const perf = muniPerformance(db);
  const sla = slaSummary(db.cases);
  const trend = monthlyReports(db.cases);
  const critical = criticalCases(db.cases, null, 5);
  const topInsight = db.insights[0];
  const recurring = db.recurringProblems.filter((r) => r.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reports" value={stats.total.toLocaleString()} sub="all municipalities (demo set)" icon={FileText} />
        <StatCard label="Open cases" value={stats.open} sub={`${stats.critical} critical active`} icon={Clock} tone="amber" />
        <StatCard label="Resolved & closed" value={stats.closed} sub={`${Math.round(stats.resolutionRate * 100)}% resolution rate`} icon={CheckCircle2} tone="emerald" />
        <StatCard label="SLA breaches" value={sla.breached} sub={`${Math.round(sla.compliance * 100)}% compliance`} icon={AlertTriangle} tone={sla.breached > 2 ? "rose" : "emerald"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Reports & resolutions — last 6 months"
            subtitle="platform-wide"
            icon={BarIcon}
            actions={<Badge className="border-blue-200 bg-blue-50 text-blue-700">live demo data</Badge>}
          />
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
          <CardHeader title="Municipality performance" subtitle="resolution rate" icon={Building2} />
          <div className="space-y-4 px-5 py-4">
            {perf.map((p) => (
              <div key={p.municipality.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{p.municipality.shortName}</span>
                  <span className="text-slate-500">
                    {p.critical > 0 && <span className="mr-2 text-rose-500">{p.critical} critical</span>}
                    <strong className="text-slate-900">{Math.round(p.resolutionRate * 100)}%</strong>
                  </span>
                </div>
                <ProgressBar value={p.resolutionRate} className={p.resolutionRate > 0.8 ? "bg-emerald-500" : p.resolutionRate > 0.6 ? "bg-amber-500" : "bg-rose-500"} />
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{p.open} open · {p.workers} workers</span>
                  <Sparkline values={trend.map((t) => t.count)} color="#94a3b8" width={60} height={16} />
                </div>
              </div>
            ))}
            <Link href="/admin/municipalities" className="flex items-center justify-end gap-1 pt-1 text-xs font-semibold text-blue-600 hover:underline">
              Compare in detail <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Critical incidents"
            subtitle="highest priority scores, active"
            icon={AlertTriangle}
            actions={<Link href="/admin/reports" className="text-xs font-semibold text-blue-600 hover:underline">All reports →</Link>}
          />
          <div className="divide-y divide-slate-100">
            {critical.map((c) => (
              <Link key={c.id} href={`/reports/${c.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-sm font-bold text-rose-600">
                  {c.priorityScore.total}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">#{c.caseNumber} · {c.title}</p>
                  <p className="text-xs text-slate-400">
                    {c.location.label} · {c.linkedReports.length} report{c.linkedReports.length > 1 ? "s" : ""} · {fmtRelative(c.createdAt, MOCK_NOW)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
                <Badge className={PRIORITY_META[c.priority].badge}>{c.priority}</Badge>
              </Link>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="AI insights" subtitle="latest from the intelligence service" icon={Sparkles} />
            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">{topInsight.title}</p>
              <p className="mt-1 line-clamp-4 text-xs leading-relaxed text-slate-500">{topInsight.body}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>{Math.round(topInsight.confidence * 100)}% confidence</span>
                <span>{fmtRelative(topInsight.at, MOCK_NOW)}</span>
              </div>
              <Link href="/admin/analytics" className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-blue-600 hover:underline">
                All insights <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recurring problems" subtitle="long-term issues detected" icon={Repeat} />
            <div className="px-5 py-4">
              <p className="text-2xl font-extrabold text-slate-900">{db.recurringProblems.length}</p>
              <p className="mt-1 text-xs text-slate-500">{recurring} active · {db.recurringProblems.length - recurring} under review / mitigated</p>
              <Link href="/admin/recurring-problems" className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-blue-600 hover:underline">
                Review <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader title="Platform health" subtitle="system monitors" icon={BadgeCheck} />
            <div className="space-y-2.5 px-5 py-4 text-xs">
              {[
                ["API gateway", "operational"],
                ["AI service", "operational"],
                ["Supabase (mock)", "local"],
                ["Realtime (mock)", "in-memory"],
              ].map(([k, v]) => (
                <p key={k} className="flex items-center justify-between">
                  <span className="text-slate-500">{k}</span>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{v}</Badge>
                </p>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

