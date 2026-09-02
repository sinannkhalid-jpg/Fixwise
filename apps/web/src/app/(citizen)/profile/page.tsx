"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCircle2, Clock, LogOut, MessageSquare, Send } from "lucide-react";
import { Avatar } from "@/components/ui/Misc";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Form";
import { ROLE_HOME } from "@/lib/personas";
import { useApp } from "@/lib/store";

export default function ProfilePage() {
  const { persona, cases, signOut } = useApp();
  const [prefs, setPrefs] = useState({ push: true, email: true, sms: false, area: true });

  const mine = cases.filter(
    (c) => c.reporter.id === persona.userId || c.linkedReports.some((r) => r.citizenId === persona.userId)
  );
  const resolved = mine.filter((c) => c.status === "CLOSED").length;
  const avg =
    mine.filter((c) => c.sla.resolvedAt).length > 0
      ? Math.round(
          mine
            .filter((c) => c.sla.resolvedAt)
            .reduce((s, c) => s + (new Date(c.sla.resolvedAt!).getTime() - new Date(c.sla.createdAt).getTime()) / 3600000, 0) /
            mine.filter((c) => c.sla.resolvedAt).length
        )
      : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profile</h1>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Card className="p-6 text-center md:col-span-1">
          <div className="mx-auto w-fit">
            <Avatar name={persona.name} size="lg" />
          </div>
          <p className="mt-3 text-base font-bold text-slate-900">{persona.name}</p>
          <p className="text-xs text-slate-500">{persona.email}</p>
          <Badge className="mt-2 border-teal-200 bg-teal-50 text-teal-700">
            {persona.role.replaceAll("_", " ")}
          </Badge>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-left text-xs text-slate-500">
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Submitted</span>
              <strong className="text-slate-800">{mine.length}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Resolved</span>
              <strong className="text-slate-800">{resolved}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Avg. resolution</span>
              <strong className="text-slate-800">{avg ? `${avg}h` : "—"}</strong>
            </p>
            <p className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Feedback given</span>
              <strong className="text-slate-800">{mine.filter((c) => c.feedback).length}</strong>
            </p>
          </div>
          {persona.role !== "CITIZEN" && (
            <Link href={ROLE_HOME[persona.role]} className="mt-4 block text-xs font-semibold text-blue-600 hover:underline">
              Open your dashboard →
            </Link>
          )}
        </Card>

        <div className="space-y-5 md:col-span-2">
          <Card>
            <CardHeader title="Notifications" subtitle="How you want status updates" icon={Bell} />
            <div className="divide-y divide-slate-100 px-5 py-2">
              {[
                { k: "push" as const, t: "Push notifications", d: "Status changes on your reports" },
                { k: "email" as const, t: "Email digests", d: "Weekly summary of your area" },
                { k: "sms" as const, t: "SMS alerts", d: "Critical updates only" },
                { k: "area" as const, t: "Area alerts", d: "New civic issues within 1 km" },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{row.t}</p>
                    <p className="text-xs text-slate-400">{row.d}</p>
                  </div>
                  <Toggle checked={prefs[row.k]} onChange={(v) => setPrefs({ ...prefs, [row.k]: v })} label={row.t} />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-900">Account session</p>
            <p className="mt-1 text-xs text-slate-500">
              You are signed in with your Fixwise account.
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
