"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CaseDetail } from "@/components/CaseDetail";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/lib/store";

export default function ManageCasePage() {
  const { id } = useParams<{ id: string }>();
  const { cases } = useApp();
  const c = cases.find((x) => x.id === id);

  if (!c)
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-900">Case not found</p>
        <Link href="/municipality/cases" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Back to cases
        </Link>
      </Card>
    );

  return (
    <div>
      <Link
        href="/municipality/cases"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> All cases
      </Link>
      <CaseDetail c={c} perspective="municipality" />
    </div>
  );
}
