"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";
import { Chip } from "@/components/ui/Badge";
import { EmptyState, InfoNote, SectionHeader } from "@/components/ui/Misc";
import { RecurringProblemCard } from "@/components/RecurringProblemCard";
import { recurringFor } from "@/lib/selectors";
import { useApp } from "@/lib/store";
import type { RecurringStatus } from "@/lib/types";

const FILTERS: { key: RecurringStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "MITIGATED", label: "Mitigated" },
];

export default function MunicipalityRecurringPage() {
  const db = useApp();
  const [filter, setFilter] = useState<RecurringStatus | "ALL">("ALL");
  const list = recurringFor(db, db.activeMunicipalityId).filter(
    (r) => filter === "ALL" || r.status === filter
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Recurring problems"
        subtitle="History says this spot fails again and again. AI proposes root causes and prevention — final calls are yours."
      />
      <InfoNote tone="violet">
        Detected from ≥3 months of clustered reports (location + category + frequency + resolution history).
        Recommendations are decision support only — they do not auto-create work orders.
      </InfoNote>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring problems detected"
          body="This municipality has no location + category cluster meeting the recurrence threshold right now."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {list.map((rp) => (
            <RecurringProblemCard key={rp.id} rp={rp} />
          ))}
        </div>
      )}
    </div>
  );
}
