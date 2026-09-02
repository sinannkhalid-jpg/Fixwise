"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Misc";
import { RecurringProblemCard } from "@/components/RecurringProblemCard";
import { SectionHeader } from "@/components/ui/Misc";
import { Repeat } from "lucide-react";
import { useApp } from "@/lib/store";
import type { RecurringStatus } from "@/lib/types";

const FILTERS: { key: RecurringStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ACTIVE", label: "Active" },
  { key: "UNDER_REVIEW", label: "Under review" },
  { key: "MITIGATED", label: "Mitigated" },
];

export default function AdminRecurringPage() {
  const { recurringProblems } = useApp();
  const [filter, setFilter] = useState<RecurringStatus | "ALL">("ALL");
  const list = recurringProblems.filter((r) => filter === "ALL" || r.status === filter);

  return (
    <div>
      <SectionHeader
        title="Recurring problems"
        subtitle="Same location, same failure, again and again — detected from history, with AI root-cause analysis and prevention recommendations"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
          </Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={Repeat} title="No recurring problems here" body="Nothing matches this filter right now." />
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
