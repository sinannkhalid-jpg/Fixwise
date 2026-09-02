"use client";

import Link from "next/link";
import { Building2, ChevronRight, UserCog } from "lucide-react";
import { Icon } from "@/components/icons";
import { HBars } from "@/components/charts";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Misc";
import { DEPARTMENTS } from "@/lib/constants";
import { useApp } from "@/lib/store";
import { ACTIVE_STATUSES } from "@/lib/constants";
import { avgResolution, slaSummary } from "@/lib/selectors";

export default function DepartmentsPage() {
  const db = useApp();
  const { activeMunicipalityId: mid, departments, workers, cases } = db;
  const depts = departments.filter((d) => d.municipalityId === mid);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Departments</h2>
        <p className="text-sm text-slate-500">
          Case load, staffing and SLA health per department. Click through to its cases.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {depts.map((d) => {
          const meta = DEPARTMENTS[d.key];
          const deptCases = cases.filter((c) => c.municipalityId === mid && c.departmentKey === d.key);
          const open = deptCases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
          const closed = deptCases.filter((c) => c.status === "CLOSED").length;
          const sla = slaSummary(deptCases);
          const avg = avgResolution(deptCases);
          const staff = workers.filter((w) => w.municipalityId === mid && w.departmentKey === d.key);
          return (
            <Card key={d.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${meta.color}1a`, color: meta.color }}>
                    <Icon name={meta.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{meta.name}</p>
                    <p className="text-xs text-slate-500">head: {d.head}</p>
                  </div>
                </div>
                <Badge className={sla.compliance > 0.8 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                  {Math.round(sla.compliance * 100)}% SLA
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-bold text-slate-900">{open}</p>
                  <p className="text-[10px] text-slate-400">open</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-bold text-emerald-600">{closed}</p>
                  <p className="text-[10px] text-slate-400">closed</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-bold text-slate-900">{staff.length}</p>
                  <p className="text-[10px] text-slate-400">workers</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-1 flex justify-between text-[11px] text-slate-400">
                  <span>resolution rate</span>
                  <span className="font-semibold text-slate-600">{deptCases.length ? Math.round((closed / deptCases.length) * 100) : 0}%</span>
                </p>
                <ProgressBar value={deptCases.length ? closed / deptCases.length : 0} className="bg-emerald-500" height="h-1.5" />
                <p className="mt-1.5 text-[10px] text-slate-400">
                  avg resolution {avg ? `${Math.round(avg)}h` : "—"} · {sla.breached} SLA breach{sla.breached === 1 ? "" : "es"}
                </p>
              </div>

              <Link
                href={`/municipality/cases?dept=${d.key}`}
                className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-700"
              >
                View department cases <ChevronRight className="h-4 w-4" />
              </Link>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Workload balance" subtitle="open cases per department" icon={Building2} />
        <div className="px-5 py-5">
          <HBars
            data={depts.map((d) => ({
              label: DEPARTMENTS[d.key].name,
              value: cases.filter((c) => c.municipalityId === mid && c.departmentKey === d.key && ACTIVE_STATUSES.includes(c.status)).length,
              color: DEPARTMENTS[d.key].color,
            }))}
          />
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          <UserCog className="h-3.5 w-3.5" /> Department admins manage their own cases; municipality admins manage all.
        </div>
      </Card>
    </div>
  );
}
