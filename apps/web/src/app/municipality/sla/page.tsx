"use client";

import Link from "next/link";
import { AlertTriangle, Settings2, Timer } from "lucide-react";
import { SLABadge, StatusBadge } from "@/components/case";
import { HBars } from "@/components/charts";
import { Card, CardHeader, StatCard } from "@/components/ui/Card";
import { InfoNote, ProgressBar } from "@/components/ui/Misc";
import { PRIORITY_META, PRIORITY_SLA_HOURS } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { slaSummary } from "@/lib/selectors";
import { useApp } from "@/lib/store";
import type { Priority } from "@/lib/types";

export default function SlaPage() {
  const { cases, activeMunicipalityId: mid } = useApp();
  const scoped = cases.filter((c) => c.municipalityId === mid);
  const summary = slaSummary(scoped);

  const rows = scoped
    .filter((c) => !["CLOSED"].includes(c.status))
    .filter((c) => c.sla.status === "BREACHED" || c.sla.status === "AT_RISK" || c.sla.status === "MET")
    .sort((a, b) => {
      const rank = { BREACHED: 0, AT_RISK: 1, MET: 2, ON_TRACK: 3 } as const;
      return rank[a.sla.status] - rank[b.sla.status];
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="SLA compliance" value={`${Math.round(summary.compliance * 100)}%`} sub="resolved within target" icon={Timer} tone="emerald" />
        <StatCard label="Breached" value={summary.breached} sub="overdue resolutions" icon={AlertTriangle} tone="rose" />
        <StatCard label="At risk" value={summary.atRisk} sub="under 25% of budget left" icon={Timer} tone="amber" />
      </div>

      <Card>
        <CardHeader
          title="SLA policy"
          subtitle="priority → resolution target (configurable server-side)"
          icon={Settings2}
        />
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-4">
          {(Object.keys(PRIORITY_SLA_HOURS) as Priority[]).map((p) => (
            <div key={p} className="rounded-xl border border-slate-200 px-4 py-3">
              <p className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_META[p].badge} ${PRIORITY_META[p].badge.includes("border") ? "border" : ""}`}>
                {p}
              </p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">
                {PRIORITY_SLA_HOURS[p]}h
              </p>
              <p className="text-[10px] text-slate-400">target from creation</p>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 px-5 py-3">
          <InfoNote tone="blue">
            The backend owns SLA computation — it tracks created/due/resolution times and breach flags. Values are
            config-driven (not hard-coded in this frontend).
          </InfoNote>
        </div>
      </Card>

      <Card>
        <CardHeader title="Case SLA status" subtitle="breached and at-risk first" icon={Timer} />
        <div className="divide-y divide-slate-100">
          {rows.slice(0, 12).map((c) => {
            const total = c.sla.hoursAllowed;
            const left = (new Date(c.sla.dueAt).getTime() - MOCK_NOW.getTime()) / 3600000;
            const spent = Math.min(1, Math.max(0, 1 - left / total));
            return (
              <Link key={c.id} href={`/municipality/cases/${c.id}`} className="block px-5 py-3.5 hover:bg-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      #{c.caseNumber} · {c.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      created {fmtDateTime(c.sla.createdAt)} · due {fmtDateTime(c.sla.dueAt)} · {c.assignment ? c.assignment.workerName : "unassigned"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={c.status} />
                    <SLABadge c={c} />
                  </div>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    value={spent}
                    className={c.sla.status === "BREACHED" ? "bg-rose-500" : c.sla.status === "AT_RISK" ? "bg-amber-500" : "bg-emerald-500"}
                    height="h-1.5"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="SLA compliance by priority" subtitle="resolved-on-time rate" icon={Timer} />
        <div className="px-5 py-5">
          <HBars
            data={(Object.keys(PRIORITY_SLA_HOURS) as Priority[]).map((p) => {
              const list = scoped.filter((c) => c.priority === p && (c.sla.status === "MET" || c.sla.status === "BREACHED"));
              const met = list.filter((c) => c.sla.status === "MET").length;
              return {
                label: p,
                value: list.length ? Math.round((met / list.length) * 100) : 100,
                color: PRIORITY_META[p].hex,
                hint: `${list.length} resolved`,
              };
            })}
            suffix="%"
          />
        </div>
      </Card>
    </div>
  );
}
