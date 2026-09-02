"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Search, ShieldAlert } from "lucide-react";
import { CategoryChip, RiskBadge, StatusBadge } from "@/components/case";
import { Chip } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/Misc";
import { CATEGORIES, RISK_META } from "@/lib/constants";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { flattenReports } from "@/lib/selectors";
import { useApp } from "@/lib/store";
import type { Municipality } from "@/lib/types";

export function ReportsTable({
  municipalities,
  muniId,
}: {
  municipalities: Municipality[];
  muniId?: string | null;
}) {
  const db = useApp();
  const rows = flattenReports(db, muniId);
  const [q, setQ] = useState("");
  const [muni, setMuni] = useState("");
  const [cat, setCat] = useState("");
  const [risk, setRisk] = useState("");

  const filtered = rows.filter(
    (r) =>
      (!muni || r.case.municipalityId === muni) &&
      (!cat || r.case.category === cat) &&
      (!risk || r.report.riskLevel === risk) &&
      (!q || `${r.report.citizenName} ${r.report.description} ${r.case.title}`.toLowerCase().includes(q.toLowerCase()))
  );

  const flagged = filtered.filter((r) => r.report.riskScore >= 60).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {!muniId && (
          <Select value={muni} onChange={(e) => setMuni(e.target.value)} className="w-auto">
            <option value="">All municipalities</option>
            {municipalities.map((m) => (
              <option key={m.id} value={m.id}>{m.shortName}</option>
            ))}
          </Select>
        )}
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-auto">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </Select>
        <Select value={risk} onChange={(e) => setRisk(e.target.value)} className="w-auto">
          <option value="">All risk levels</option>
          {(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const).map((r) => (
            <option key={r} value={r}>{RISK_META[r].label}</option>
          ))}
        </Select>
        <div className="relative ml-auto w-full sm:w-60">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports…" className="pl-9" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <Chip active>{filtered.length} reports</Chip>
        <Chip>{new Set(filtered.map((r) => r.case.id)).size} unique cases</Chip>
        {flagged > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 font-medium text-rose-700">
            <ShieldAlert className="h-3 w-3" /> {flagged} flagged for review
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No reports match" body="Try clearing the filters above." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">Citizen</th>
                <th className="px-3 py-3 font-semibold">Report</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 font-semibold">Risk</th>
                <th className="px-3 py-3 font-semibold">Case</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map(({ report, case: c, isPrimary }) => (
                <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{report.citizenName}</p>
                    {!isPrimary && <p className="text-[10px] text-teal-600">linked report</p>}
                  </td>
                  <td className="max-w-56 px-3 py-3">
                    <p className="truncate text-xs text-slate-600">{report.description}</p>
                    {report.hasPhoto && <Camera className="mt-1 h-3 w-3 text-slate-300" />}
                  </td>
                  <td className="px-3 py-3"><CategoryChip category={c.category} /></td>
                  <td className="px-3 py-3">
                    <RiskBadge level={report.riskLevel} />
                    <span className="ml-1 text-[10px] text-slate-400">{report.riskScore}</span>
                  </td>
                  <td className="px-3 py-3">
                    <Link href={`/reports/${c.id}`} className="font-semibold text-blue-600 hover:underline">
                      #{c.caseNumber}
                    </Link>
                    <p className="text-[10px] text-slate-400">{c.location.label}</p>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-5 py-3 text-right text-xs text-slate-400">{fmtRelative(report.createdAt, MOCK_NOW)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
