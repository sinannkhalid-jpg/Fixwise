"use client";

import { MapExplorer } from "@/components/MapExplorer";
import { SectionHeader } from "@/components/ui/Misc";
import { useApp } from "@/lib/store";
import { MUNI_BY_ID } from "@/lib/mock/data";

export default function MunicipalityMapPage() {
  const { activeMunicipalityId } = useApp();
  const muni = MUNI_BY_ID[activeMunicipalityId];
  return (
    <div>
      <SectionHeader
        title={`Incident map — ${muni?.shortName}`}
        subtitle="Cases by priority with hotspot overlays. Filters by category/priority; click pins for details."
      />
      <MapExplorer muniId={activeMunicipalityId} spanKm={18} />
    </div>
  );
}
