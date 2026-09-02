"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Info, Phone, Plus, Power, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select } from "@/components/ui/Form";
import { InfoNote, ProgressBar } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Modal";
import { DEPARTMENTS } from "@/lib/constants";
import { canManageCases } from "@/lib/personas";
import { workerLoad } from "@/lib/selectors";
import { useApp } from "@/lib/store";
import type { DepartmentKey } from "@/lib/types";

export default function WorkersPage() {
  const db = useApp();
  const { activeMunicipalityId: mid, workers, cases, addWorker, toggleWorker, persona } = db;
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", dept: "roads" as DepartmentKey });
  const [expanded, setExpanded] = useState<string | null>(null);

  const list = workers.filter((w) => w.municipalityId === mid);
  const canManage = canManageCases(persona) && persona.role !== "DEPARTMENT_ADMIN";

  function submitWorker() {
    setError("");
    try {
      addWorker(form.name.trim(), form.phone.trim(), form.dept, mid);
      setAddOpen(false);
      setForm({ name: "", phone: "", dept: "roads" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-5">
      <InfoNote tone="blue">
        <span className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>There is no separate worker app.</strong> Field workers are records managed here; authorized
            staff assign them to cases and update case status on their behalf. Workers&apos; evidence is uploaded
            through the case page.
          </span>
        </span>
      </InfoNote>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Workers</h2>
          <p className="text-sm text-slate-500">
            {list.length} workers · {list.filter((w) => w.active).length} active
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add worker
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-semibold">Worker</th>
              <th className="px-3 py-3 font-semibold">Department</th>
              <th className="px-3 py-3 font-semibold">Contact</th>
              <th className="px-3 py-3 font-semibold">Active cases</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((w) => {
              const load = workerLoad(db, w.id);
              const assigned = cases.filter(
                (c) => c.assignment?.workerId === w.id && !["CLOSED", "REJECTED"].includes(c.status)
              );
              return (
                <Fragment key={w.id}>
                  <tr className={`border-b border-slate-50 ${!w.active ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{w.name}</p>
                      <p className="text-[10px] text-slate-400">{w.id}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">{DEPARTMENTS[w.departmentKey].name}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {w.phone}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-28">
                        <p className="mb-1 text-xs font-semibold text-slate-700">
                          {load.active}
                          <span className="ml-1 font-normal text-slate-400">/ {load.total} total</span>
                        </p>
                        <ProgressBar value={load.active / 5} className={load.active >= 4 ? "bg-rose-500" : "bg-blue-500"} height="h-1.5" />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={w.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}>
                        {w.active ? "active" : "inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                        >
                          <Users className="h-3.5 w-3.5" /> Cases
                        </Button>
                        {canManage && (
                          <Button size="sm" variant="outline" onClick={() => toggleWorker(w.id)}>
                            <Power className="h-3.5 w-3.5" /> {w.active ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === w.id && (
                    <tr key={`${w.id}-x`} className="border-b border-slate-50 bg-slate-50/60">
                      <td colSpan={6} className="px-5 py-3">
                        {assigned.length === 0 ? (
                          <p className="text-xs text-slate-500">No active assignments.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assigned.map((c) => (
                              <Link
                                key={c.id}
                                href={`/municipality/cases/${c.id}`}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
                              >
                                #{c.caseNumber} · {c.title.slice(0, 34)}… · {c.status.replaceAll("_", " ").toLowerCase()}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add field worker" subtitle="Workers are managed here — there is no worker signup">
        <div className="space-y-4">
          <Field label="Full name" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ravi Shinde" />
          </Field>
          <Field label="Phone" required>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98XXXXXXXX" />
          </Field>
          <Field label="Department" required>
            <Select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value as DepartmentKey })}>
              {Object.entries(DEPARTMENTS).map(([k, d]) => (
                <option key={k} value={k}>{d.name}</option>
              ))}
            </Select>
          </Field>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button disabled={!form.name.trim() || !form.phone.trim()} onClick={submitWorker}>
              <UserCheck className="h-4 w-4" /> Add worker
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
