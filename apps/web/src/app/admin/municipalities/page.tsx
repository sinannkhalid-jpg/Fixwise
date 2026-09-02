"use client";

import Link from "next/link";
import { Building2, Plus, Users } from "lucide-react";
import { HBars, Sparkline } from "@/components/charts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Modal";
import { Field, Input } from "@/components/ui/Form";
import { useState } from "react";
import { monthlyReports, muniPerformance } from "@/lib/selectors";
import { useApp } from "@/lib/store";

export default function AdminMunicipalitiesPage() {
  const db = useApp();
  const perf = muniPerformance(db);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Municipalities</h2>
          <p className="text-sm text-slate-500">Onboarded corporations and their performance</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add municipality
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {perf.map((p) => {
          const trend = monthlyReports(db.cases.filter((c) => c.municipalityId === p.municipality.id));
          return (
            <Card key={p.municipality.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.municipality.shortName}</p>
                    <p className="text-xs text-slate-500">{p.municipality.name}</p>
                  </div>
                </div>
                <Badge className={p.resolutionRate > 0.75 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                  {Math.round(p.resolutionRate * 100)}% resolved
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-bold text-slate-900">{p.total}</p>
                  <p className="text-[10px] text-slate-400">cases</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-bold text-rose-600">{p.critical}</p>
                  <p className="text-[10px] text-slate-400">critical</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-2">
                  <p className="text-lg font-bold text-slate-900">{Math.round(p.sla.compliance * 100)}%</p>
                  <p className="text-[10px] text-slate-400">SLA</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Sparkline values={trend.map((t) => t.count)} color="#2563eb" width={110} height={26} />
                <Link href="/admin/map" className="text-xs font-semibold text-blue-600 hover:underline">
                  View on map →
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Comparison" subtitle="resolution rate · SLA compliance · workload" icon={Users} />
        <div className="grid gap-8 px-5 py-5 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Resolution rate</p>
            <HBars
              data={perf.map((p) => ({
                label: p.municipality.shortName,
                value: Math.round(p.resolutionRate * 100),
                color: "#2563eb",
              }))}
              suffix="%"
            />
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">SLA compliance</p>
            <HBars
              data={perf.map((p) => ({
                label: p.municipality.shortName,
                value: Math.round(p.sla.compliance * 100),
                color: p.sla.compliance > 0.8 ? "#10b981" : "#f59e0b",
                hint: `${p.sla.breached} breached`,
              }))}
              suffix="%"
            />
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Avg resolution time (hours)</p>
          <HBars
            data={perf.map((p) => ({
              label: p.municipality.shortName,
              value: p.avgResolutionHours ? Math.round(p.avgResolutionHours) : 0,
              color: "#6366f1",
            }))}
            suffix="h"
          />
        </div>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add municipality" subtitle="Demo — persisted until refresh; real onboarding lands with the backend">
        <div className="space-y-4">
          <Field label="Municipality name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Thane Municipal Corporation" />
          </Field>
          <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-900">
            Onboarding provisions: departments from the standard template (Roads, Water, Electrical, Sanitation,
            Drainage, Traffic, Parks & Infrastructure), RLS policies, storage buckets and an administrator invite.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              disabled={!name.trim()}
              onClick={() => {
                setAddOpen(false);
                setName("");
              }}
            >
              Provision (demo)
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
