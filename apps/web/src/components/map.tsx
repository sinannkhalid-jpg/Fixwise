"use client";

// Schematic city map — dependency-free SVG stand-in for Leaflet/MapLibre.
// Projects lat/lng into a stylized canvas with case pins and hotspot halos.

import { useId } from "react";
import { CATEGORY_MAP, PRIORITY_META } from "@/lib/constants";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  size?: number;
  kind?: "pin" | "hotspot" | "city";
  radiusKm?: number;
  intensity?: number;
  label?: string;
  showLabel?: boolean;
  title?: string;
}

export function SchematicMap({
  center,
  spanKm,
  markers,
  height = 420,
  onSelect,
  selectedId,
  showLegend = true,
}: {
  center: { lat: number; lng: number };
  spanKm: number;
  markers: MapMarker[];
  height?: number;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  showLegend?: boolean;
}) {
  const gradId = useId().replace(/:/g, "");
  const W = 1000;
  const H = 700;
  const kmPerLat = 111.32;
  const kmPerLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
  const px = (lng: number) => W / 2 + ((lng - center.lng) * kmPerLng / spanKm) * (W * 0.92);
  const py = (lat: number) => H / 2 - ((lat - center.lat) * kmPerLat / spanKm) * (H * 0.92);
  const rpx = (km: number) => (km / spanKm) * (W * 0.92);

  return (
    <div>
      <div
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
        style={{ height }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="map">
          <defs>
            <radialGradient id={`hs-${gradId}`}>
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.42" />
              <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`bg-${gradId}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#eef2f7" />
            </linearGradient>
          </defs>

          <rect width={W} height={H} fill={`url(#bg-${gradId})`} />

          {/* decorative grid */}
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={(i * W) / 10} y1="0" x2={(i * W) / 10} y2={H} stroke="#e2e8f0" strokeWidth="1" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={(i * H) / 7} x2={W} y2={(i * H) / 7} stroke="#e2e8f0" strokeWidth="1" />
          ))}

          {/* river */}
          <path
            d={`M 60 640 C 260 560, 300 420, 520 400 C 720 380, 800 240, 960 210`}
            fill="none"
            stroke="#bae6fd"
            strokeWidth="26"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* ring road */}
          <ellipse cx={W / 2} cy={H / 2} rx={W * 0.3} ry={H * 0.28} fill="none" stroke="#cbd5e1" strokeWidth="6" strokeDasharray="18 12" opacity="0.6" />
          <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#cbd5e1" strokeWidth="6" opacity="0.5" />
          <line x1={W / 2} y1="0" x2={W / 2} y2={H} stroke="#cbd5e1" strokeWidth="6" opacity="0.5" />

          {/* hotspots under pins */}
          {markers
            .filter((m) => m.kind === "hotspot")
            .map((m) => (
              <g key={m.id} onClick={() => onSelect?.(m.id)} className={onSelect ? "cursor-pointer" : ""}>
                <title>{`${m.label} · ${m.radiusKm ? m.radiusKm.toFixed(1) : ""}km`}</title>
                <circle cx={px(m.lng)} cy={py(m.lat)} r={rpx(m.radiusKm ?? 0.8)} fill={`url(#hs-${gradId})`} />
                <circle
                  cx={px(m.lng)}
                  cy={py(m.lat)}
                  r={rpx(m.radiusKm ?? 0.8)}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  opacity="0.6"
                />
              </g>
            ))}

          {/* pins */}
          {markers
            .filter((m) => m.kind !== "hotspot")
            .map((m) => {
              const color = m.color ?? "#2563eb";
              const r = m.size ?? 9;
              const sel = selectedId === m.id;
              return (
                <g key={m.id} onClick={() => onSelect?.(m.id)} className={onSelect ? "cursor-pointer" : ""}>
                  <title>{m.title ?? m.label ?? m.id}</title>
                  {sel && <circle cx={px(m.lng)} cy={py(m.lat)} r={r + 7} fill={color} opacity="0.25" />}
                  <circle cx={px(m.lng)} cy={py(m.lat)} r={r + 3} fill={color} opacity="0.22" />
                  <circle cx={px(m.lng)} cy={py(m.lat)} r={r} fill={color} stroke="#fff" strokeWidth="2.5" />
                  {m.kind === "city" && (
                    <text x={px(m.lng)} y={py(m.lat) - r - 8} textAnchor="middle" fontSize="15" fontWeight="700" fill="#334155">
                      {m.label}
                    </text>
                  )}
                  {m.showLabel && m.kind !== "city" && (
                    <text x={px(m.lng)} y={py(m.lat) + r + 13} textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">
                      {m.label}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
      </div>

      {showLegend && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
          <span className="font-medium text-slate-600">Priority:</span>
          {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((p) => (
            <span key={p} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIORITY_META[p].hex }} />
              {PRIORITY_META[p].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-rose-400 bg-rose-100" />
            Hotspot
          </span>
        </div>
      )}
    </div>
  );
}

export function caseMarkerColor(priority: string): string {
  return (PRIORITY_META as Record<string, { hex: string }>)[priority]?.hex ?? "#2563eb";
}

export function categoryColor(category: string): string {
  return (CATEGORY_MAP as Record<string, { bar: string }>)[category]?.bar ?? "#2563eb";
}
