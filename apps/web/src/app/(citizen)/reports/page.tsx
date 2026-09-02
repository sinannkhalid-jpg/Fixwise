"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, MapPin, Search, ListChecks, Users } from "lucide-react";
import {
  CategoryChip,
  PhotoTile,
  PriorityBadge,
  SLABadge,
  StatusBadge,
} from "@/components/case";
import { Chip } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/Misc";
import { STATUS_META } from "@/lib/constants";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { useApp } from "@/lib/store";
import type { CaseStatus } from "@/lib/types";

const FILTERS: { key: string; label: string; match: (s: CaseStatus) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "open", label: "Open", match: (s) => !["CLOSED", "REJECTED"].includes(s) },
  { key: "progress", label: "In progress", match: (s) => s === "IN_PROGRESS" },
  { key: "waiting", label: "Awaiting verification", match: (s) => s === "RESOLVED" || s === "VERIFICATION" },
  { key: "closed", label: "Resolved", match: (s) => s === "CLOSED" },
];

export default function MyReportsPage() {
  const { cases, persona } = useApp();
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const mine = cases.filter(
    (c) => c.reporter.id === persona.userId || c.linkedReports.some((r) => r.citizenId === persona.userId)
  );
  const list = mine
    .filter((c) => FILTERS.find((f) => f.key === filter)!.match(c.status))
    .filter((c) => (q ? `${c.title} ${c.description} ${c.location.label}`.toLowerCase().includes(q.toLowerCase()) : true))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mine.length} report{mine.length === 1 ? "" : "s"} · signed in as {persona.name}
          </p>
        </div>
        <Link
          href="/report"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + New report
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ListChecks}
            title="No reports here yet"
            body="When you report an issue it appears here with live status tracking. Reports linked as duplicates of other cases also show up."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {list.map((c) => (
            <Link key={c.id} href={`/reports/${c.id}`}>
              <Card className="p-4">
                <div className="flex gap-4">
                  <div className="hidden w-28 shrink-0 sm:block">
                    <PhotoTile
                      category={c.category}
                      className="h-24"
                      dataUrl={c.evidence.find((e) => e.photoDataUrl)?.photoDataUrl}
                      label="photo"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{c.caseNumber}</span>
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                      {c.linkedReports.length > 1 && (
                        <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
                          <Users className="h-3 w-3" /> {c.linkedReports.length} citizens
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">{c.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {c.location.label}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> updated {fmtRelative(c.updatedAt, MOCK_NOW)}</span>
                      {!["CLOSED", "REJECTED"].includes(c.status) && <SLABadge c={c} />}
                    </p>
                    <div className="mt-2">
                      <CategoryChip category={c.category} />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
