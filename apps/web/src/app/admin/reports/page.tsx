"use client";

import { SectionHeader } from "@/components/ui/Misc";
import { ReportsTable } from "@/components/ReportsTable";
import { useApp } from "@/lib/store";

export default function AdminReportsPage() {
  const { municipalities } = useApp();
  return (
    <div>
      <SectionHeader
        title="All reports"
        subtitle="Every citizen submission across municipalities — duplicates stay linked to their case, never deleted"
      />
      <ReportsTable municipalities={municipalities} />
    </div>
  );
}
