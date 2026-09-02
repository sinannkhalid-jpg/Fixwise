"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CaseDetail } from "@/components/CaseDetail";
import { Card } from "@/components/ui/Card";
import { useApp } from "@/lib/store";

export default function CaseTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { cases } = useApp();
  const c = cases.find((x) => x.id === id);

  if (!c)
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Card className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-900">Case not found</p>
          <p className="mt-1 text-xs text-slate-500">It may have been merged — check My Reports.</p>
          <Link href="/reports" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            ← Back to my reports
          </Link>
        </Card>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/reports" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> My reports
      </Link>
      <CaseDetail c={c} perspective="citizen" />
    </div>
  );
}
