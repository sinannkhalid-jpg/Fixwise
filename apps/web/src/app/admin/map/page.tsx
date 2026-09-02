"use client";

import { MapExplorer } from "@/components/MapExplorer";
import { SectionHeader } from "@/components/ui/Misc";

export default function AdminMapPage() {
  return (
    <div>
      <SectionHeader
        title="Global incident map"
        subtitle="All municipalities — filter by category and priority, toggle hotspots"
      />
      <MapExplorer spanKm={210} />
    </div>
  );
}
