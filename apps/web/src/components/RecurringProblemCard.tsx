"use client";

import { useState } from "react";
import { BrainCircuit, CheckCircle2, Eye, Lightbulb, MapPin, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { MiniBars } from "@/components/charts";
import { CategoryChip } from "@/components/case";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CATEGORY_MAP } from "@/lib/constants";
import { MUNI_BY_ID } from "@/lib/mock/data";
import { useApp } from "@/lib/store";
import type { RecurringProblem } from "@/lib/types";

const TREND = {
  RISING: { icon: TrendingUp, cls: "border-rose-200 bg-rose-50 text-rose-700", label: "Rising" },
  STABLE: { icon: Minus, cls: "border-slate-200 bg-slate-50 text-slate-600", label: "Stable" },
  FALLING: { icon: TrendingDown, cls: "border-emerald-200 bg-emerald-50 text-emerald-700", label: "Improving" },
};

export function RecurringProblemCard({ rp }: { rp: RecurringProblem }) {
  const { setRecurringStatus } = useApp();
  const [showAI, setShowAI] = useState(false);
  const trend = TREND[rp.trend];
  const TrendIcon = trend.icon;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={rp.category} />
            <Badge className={trend.cls}>
              <TrendIcon className="h-3 w-3" /> {trend.label}
            </Badge>
            <Badge
              className={
                rp.status === "ACTIVE"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : rp.status === "UNDER_REVIEW"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }
            >
              {rp.status.replaceAll("_", " ").toLowerCase()}
            </Badge>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">{rp.locationLabel}</p>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" /> {MUNI_BY_ID[rp.municipalityId]?.name} · {rp.totalReports} reports total
          </p>
        </div>
        <div className="text-right">
          <MiniBars values={rp.months.map((m) => m.count)} color={CATEGORY_MAP[rp.category].bar} width={120} height={36} />
          <p className="mt-1 text-[10px] text-slate-400">{rp.months[0].month}–{rp.months[rp.months.length - 1].month} monthly reports</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-800">
          <BrainCircuit className="h-4 w-4" /> Root-cause hypothesis · {Math.round(rp.confidence * 100)}% confidence
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{rp.rootCause}</p>
      </div>

      {showAI && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
            <Lightbulb className="h-4 w-4" /> AI recommendation (decision support)
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{rp.recommendation}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setShowAI(!showAI)}>
          <Lightbulb className="h-4 w-4" /> {showAI ? "Hide" : "AI recommendation"}
        </Button>
        {rp.status !== "UNDER_REVIEW" && (
          <Button size="sm" variant="ghost" onClick={() => setRecurringStatus(rp.id, "UNDER_REVIEW")}>
            <Eye className="h-4 w-4" /> Mark under review
          </Button>
        )}
        {rp.status !== "MITIGATED" && (
          <Button size="sm" variant="ghost" onClick={() => setRecurringStatus(rp.id, "MITIGATED")}>
            <CheckCircle2 className="h-4 w-4" /> Mark mitigated
          </Button>
        )}
        <span className="ml-auto text-[10px] text-slate-400">first seen {rp.firstSeen.slice(0, 10)}</span>
      </div>
    </Card>
  );
}
