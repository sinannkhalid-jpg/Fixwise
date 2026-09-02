"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ClipboardList, Search, UserPlus } from "lucide-react";
import { PriorityBadge, SLABadge, StatusBadge } from "@/components/case";
import { Chip } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/Misc";
import { CATEGORIES, DEPARTMENTS, PRIORITY_META } from "@/lib/constants";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { useApp } from "@/lib/store";
import type { CaseStatus, Priority } from "@/lib/types";

export default function CasesPage() {
  return (
    <Suspense fallback={null}>
      <CasesTable />
    </Suspense>
  );
}

function CasesTable() {
  const params = useSearchParams();
  const { cases, activeMunicipalityId: mid } = useApp();
  const [status, setStatus] = useState<string>("");
  const [priority, setPriority] = useState<string>(params.get("priority") ?? "");
  const [dept, setDept] = useState<string>(params.get("dept") ?? "");
  const [sla, setSla] = useState("");
  const [q, setQ] = useState("");

  const list = cases
    .filter((c) => c.municipalityId === mid)
    .filter((c) => !status || c.status === status)
    .filter((c) => !priority || c.priority === priority)
    .filter((c) => !dept || c.departmentKey === dept)
    .filter((c) => !sla || (sla === "BREACH" ? c.sla.status === "BREACHED" : c.sla.status === "AT_RISK"))
    .filter((c) => !q || `${c.title} ${c.location.label} #${c.caseNumber}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const unassigned = list.filter((c) => !c.assignment && !["CLOSED", "REJECTED"].includes(c.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Cases</h2>
          <p className="text-sm text-slate-500">
            {list.length} cases · {unassigned} awaiting worker assignment
          </p>
        </div>
        {unassigned > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            <UserPlus className="h-3 w-3" /> {unassigned} need assignment
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
          <option value="">All statuses</option>
          {(["REPORTED","ANALYZING","ASSIGNED","IN_PROGRESS","RESOLVED","VERIFICATION","CLOSED","REJECTED","REOPENED"] as CaseStatus[]).map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-auto">
          <option value="">All priorities</option>
          {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </Select>
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="w-auto">
          <option value="">All departments</option>
          {Object.entries(DEPARTMENTS).map(([k, d]) => (
            <option key={k} value={k}>{d.name}</option>
          ))}
        </Select>
        <Chip active={sla === ""} onClick={() => setSla("")}>Any SLA</Chip>
        <Chip active={sla === "AT_RISK"} onClick={() => setSla("AT_RISK")}>At risk</Chip>
        <Chip active={sla === "BREACH"} onClick={() => setSla("BREACH")}>Breached</Chip>
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cases…" className="pl-9" />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No cases match" body="Adjust the filters to see more cases." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">Case</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Priority</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">SLA</th>
                <th className="px-3 py-3 font-semibold">Worker</th>
                <th className="px-5 py-3 text-right font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link href={`/municipality/cases/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                      #{c.caseNumber}
                    </Link>
                    <p className="max-w-64 truncate text-xs text-slate-600">{c.title}</p>
                    <p className="text-[10px] text-slate-400">{c.location.label}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600">
                    {CATEGORIES.find((x) => x.key === c.category)?.label}
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={c.priority} />
                    <span className="ml-1 text-[10px] text-slate-400">{c.priorityScore.total}</span>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3"><SLABadge c={c} /></td>
                  <td className="px-3 py-3 text-xs">
                    {c.assignment ? (
                      <span className="font-medium text-slate-700">{c.assignment.workerName}</span>
                    ) : (
                      <span className={["CLOSED", "REJECTED"].includes(c.status) ? "text-slate-300" : "font-medium text-amber-600"}>
                        unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-slate-400">{fmtRelative(c.updatedAt, MOCK_NOW)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
