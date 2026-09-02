"use client";

import { BarChart3, Clock, PieChart, Star } from "lucide-react";
import { BarChart, Donut, HBars, LineChart } from "@/components/charts";
import { Card, CardHeader } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/Misc";
import { DEPARTMENTS } from "@/lib/constants";
import {
  categoryDist,
  deptPerformance,
  globalStats,
  monthlyReports,
  priorityResolution,
  satisfactionByMonth,
  statusCounts,
} from "@/lib/selectors";
import { useApp } from "@/lib/store";

export default function MunicipalityAnalyticsPage() {
  const db = useApp();
  const mid = db.activeMunicipalityId;
  const scoped = db.cases.filter((c) => c.municipalityId === mid);
  const stats = globalStats(scoped);
  const trend = monthlyReports(scoped);
  const cats = categoryDist(scoped).slice(0, 6);
  const statuses = statusCounts(scoped);
  const byPriority = priorityResolution(scoped);
  const deptPerf = deptPerformance(db, mid);
  const satisfaction = satisfactionByMonth(scoped);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analytics"
        subtitle={`Local trends for ${stats.total} cases — workload, performance and citizen satisfaction`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Monthly trend" subtitle="reports vs closed" icon={BarChart3} />
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
          <CardHeader title="Categories" subtitle="local mix" icon={PieChart} />
          <div className="px-4 py-6">
            <Donut data={cats} centerValue={stats.total} centerLabel="cases" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Department performance" subtitle="total cases handled" icon={BarChart3} />
          <div className="px-5 py-5">
            <HBars
              data={deptPerf.map((d) => ({
                label: DEPARTMENTS[d.key].name,
                value: d.total,
                color: DEPARTMENTS[d.key].color,
                hint: `${d.sla.compliance ? Math.round(d.sla.compliance * 100) : 100}% SLA`,
              }))}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Avg resolution by priority" subtitle="hours" icon={Clock} />
          <div className="px-4 py-4">
            <BarChart
              data={byPriority.map((p) => ({ label: p.label, value: p.value, color: p.priority === "CRITICAL" ? "#f43f5e" : p.priority === "HIGH" ? "#f97316" : p.priority === "MEDIUM" ? "#f59e0b" : "#94a3b8" }))}
              suffix="h"
            />
            <p className="mt-2 text-[11px] text-slate-400">Pipeline by status below — reopening loops are normal.</p>
            <div className="mt-3">
              <BarChart data={statuses.map((s) => ({ label: s.label, value: s.value, color: "#6366f1" }))} height={140} />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Citizen satisfaction" subtitle="avg rating by month (feedback after closure)" icon={Star} />
        <div className="px-4 py-4">
          <LineChart
            labels={satisfaction.map((s) => s.month)}
            series={[{ name: "Rating", color: "#14b8a6", values: satisfaction.map((s) => s.value || 0) }]}
            height={160}
          />
        </div>
      </Card>
    </div>
  );
}
