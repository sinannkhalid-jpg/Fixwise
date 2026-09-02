"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Layers, MapPinned } from "lucide-react";
import { SchematicMap, caseMarkerColor, type MapMarker } from "@/components/map";
import { PriorityBadge, SLABadge, StatusBadge } from "@/components/case";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Form";
import { CATEGORIES, CATEGORY_MAP, PRIORITY_META } from "@/lib/constants";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { hotspots } from "@/lib/selectors";
import { useApp } from "@/lib/store";
import type { Category, Priority } from "@/lib/types";

export function MapExplorer({ muniId, spanKm }: { muniId?: string | null; spanKm: number }) {
  const db = useApp();
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [showHotspots, setShowHotspots] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const munis = muniId ? db.municipalities.filter((m) => m.id === muniId) : db.municipalities;
  const center = muniId
    ? db.municipalities.find((m) => m.id === muniId)!.center
    : { lat: 19.05, lng: 73.83 };

  const cases = useMemo(
    () =>
      db.cases.filter(
        (c) =>
          (!muniId || c.municipalityId === muniId) &&
          (!category || c.category === category) &&
          (!priority || c.priority === priority)
      ),
    [db.cases, muniId, category, priority]
  );

  const hs = useMemo(() => (showHotspots && !category ? hotspots(db, muniId) : []), [db, muniId, showHotspots, category]);

  const markers: MapMarker[] = [
    ...(!muniId
      ? munis.map((m) => ({
          id: `city-${m.id}`,
          lat: m.center.lat,
          lng: m.center.lng,
          kind: "city" as const,
          color: "#2563eb",
          size: 11,
          label: m.shortName,
        }))
      : []),
    ...hs.map((h) => ({
      id: h.id,
      lat: h.center.lat,
      lng: h.center.lng,
      kind: "hotspot" as const,
      radiusKm: h.radiusKm,
      label: `${h.label} (${h.caseCount} cases)`,
    })),
    ...cases.map((c) => ({
      id: c.id,
      lat: c.location.lat,
      lng: c.location.lng,
      color: caseMarkerColor(c.priority),
      size: c.priority === "CRITICAL" ? 10 : 8,
      title: `#${c.caseNumber} ${c.title} — ${c.priority}`,
    })),
  ];

  const selCase = selected?.startsWith("c-") ? db.cases.find((c) => c.id === selected) : null;
  const selHotspot = selected?.startsWith("hs-") ? hs.find((h) => h.id === selected) : null;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-auto">
            <option value="">All priorities</option>
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_META[p].label}</option>
            ))}
          </Select>
          <button
            onClick={() => setShowHotspots(!showHotspots)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
              showHotspots ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-300 bg-white text-slate-600"
            }`}
          >
            <Layers className="h-3.5 w-3.5" /> Hotspots {showHotspots ? "on" : "off"}
          </button>
          <span className="ml-auto text-xs text-slate-400">
            {cases.length} cases · {hs.length} hotspots
          </span>
        </div>

        <SchematicMap
          center={center}
          spanKm={spanKm}
          markers={markers}
          height={460}
          onSelect={setSelected}
          selectedId={selected}
        />
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <MapPinned className="h-4 w-4" /> Selected
        </p>
        {!selCase && !selHotspot && (
          <Card className="p-5 text-sm text-slate-500">
            Click a pin or hotspot halo on the map to inspect it.
          </Card>
        )}
        {selHotspot && (
          <Card className="p-5">
            <Badge className="border-rose-200 bg-rose-50 text-rose-700">Hotspot</Badge>
            <p className="mt-2 text-sm font-bold text-slate-900">{selHotspot.label}</p>
            <p className="mt-1 text-xs text-slate-500">
              {selHotspot.caseCount} cases · radius ≈ {selHotspot.radiusKm.toFixed(1)} km
            </p>
            <div className="mt-3">
              <Select
                value={selHotspot.category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </Select>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Hotspots are computed with PostGIS geographic clustering once the backend lands; this demo clusters
              cases by area + category.
            </p>
          </Card>
        )}
        {selCase && (
          <Card className="p-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={selCase.status} />
              <PriorityBadge priority={selCase.priority} />
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">#{selCase.caseNumber} · {selCase.title}</p>
            <p className="mt-1 text-xs text-slate-400">
              {CATEGORY_MAP[selCase.category].label} · {selCase.location.label} · {fmtRelative(selCase.createdAt, MOCK_NOW)}
            </p>
            <div className="mt-3">
              <SLABadge c={selCase} />
            </div>
            <Link
              href={`/reports/${selCase.id}`}
              className="mt-4 block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open case details
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
