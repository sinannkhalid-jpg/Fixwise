"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { ReportsTable } from "@/components/ReportsTable";
import { InfoNote, SectionHeader } from "@/components/ui/Misc";
import { useApp } from "@/lib/store";
import { MUNI_BY_ID } from "@/lib/mock/data";

export default function MunicipalityReportsPage() {
  const { municipalities, activeMunicipalityId } = useApp();
  const muni = MUNI_BY_ID[activeMunicipalityId];
  return (
    <div className="space-y-4">
      <SectionHeader
        title={`Reports — ${muni?.shortName}`}
        subtitle="Citizen submissions for this municipality. Duplicate reports stay linked to their case; flagged ones need review, not rejection."
      />
      <InfoNote tone="blue">
        <span className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Reports with <strong>HIGH / VERY HIGH</strong> risk go to manual review per policy — they are never
          auto-deleted. Duplicate rows marked <em>linked report</em> were merged into an existing case.
        </span>
      </InfoNote>
      <ReportsTable municipalities={municipalities} muniId={activeMunicipalityId} />
    </div>
  );
}
