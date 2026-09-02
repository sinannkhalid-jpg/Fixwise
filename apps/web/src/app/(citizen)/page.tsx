"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CATEGORIES } from "@/lib/constants";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";
import { globalStats } from "@/lib/selectors";
import { useApp } from "@/lib/store";

export default function HomePage() {
  const { cases, municipalities } = useApp();
  const stats = globalStats(cases);
  const recentClosed = cases
    .filter((c) => c.status === "CLOSED" && c.feedback)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div>
      {/* hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
              <Sparkles className="h-3 w-3" /> AI-assisted civic reporting
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              See it. Report it.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                Get it fixed.
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
              Potholes, flooding, garbage, broken streetlights, water leaks — report any civic issue in under a
              minute with a photo and your location. AI classifies it, checks for duplicates, and routes it to the
              right municipal department. You track every step until it&apos;s verified fixed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/report"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Report an issue <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reports"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-base font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Track my reports
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {stats.closed} issues resolved (demo)</span>
              <span className="flex items-center gap-1.5"><Timer className="h-4 w-4 text-blue-500" /> SLA-tracked resolution</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-teal-500" /> Nothing gets lost</span>
            </div>
          </div>

          {/* mock phone card */}
          <div className="relative mx-auto w-full max-w-sm animate-fade-up">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-slate-900 to-slate-700 px-5 py-4">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Case #1024 · live</p>
                <p className="mt-1 text-sm font-semibold text-white">Large pothole on FC Road</p>
                <div className="mt-3 flex gap-2">
                  <Badge className="border-amber-200 bg-amber-100 text-amber-800">Pothole</Badge>
                  <Badge className="border-orange-200 bg-orange-100 text-orange-800">HIGH priority</Badge>
                  <Badge className="border-blue-200 bg-blue-100 text-blue-800">3 reports</Badge>
                </div>
              </div>
              <div className="space-y-3 px-5 py-4">
                {[
                  ["Report received", "Ananya · just now", true],
                  ["AI: severity 0.84 · route to Roads", "Gemma analysis", true],
                  ["PMC · Roads department", "auto-routed by GPS", true],
                  ["Worker assigned", "Ravi Shinde", true],
                  ["In progress", "SLA 24h · on track", false],
                ].map(([label, sub, done], i, arr) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"}`}>
                      {done ? "✓" : i + 1}
                    </span>
                    <div className="min-w-0 flex-1 border-b border-slate-100 pb-3 last:border-0">
                      <p className="text-xs font-semibold text-slate-800">{label as string}</p>
                      <p className="text-[11px] text-slate-400">{sub as string}</p>
                    </div>
                    {i === arr.length - 1 && <span className="mt-1 h-2 w-2 animate-pulse rounded-full bg-blue-600" />}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* stats band */}
        <div className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-slate-100 px-4 py-6 sm:grid-cols-4 sm:divide-x">
            {[
              [stats.total, "reports processed"],
              [`${Math.round(stats.resolutionRate * 100)}%`, "resolution rate"],
              [municipalities.length, "municipalities"],
              [`${stats.satisfaction.toFixed(1)}/5`, "citizen rating"],
            ].map(([v, l]) => (
              <div key={l as string} className="px-2 py-2 text-center">
                <p className="text-2xl font-extrabold text-slate-900">{v}</p>
                <p className="mt-0.5 text-xs text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* categories */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">What can you report?</h2>
          <p className="mt-2 text-sm text-slate-500">Pick a category — AI will still verify and re-route if needed.</p>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link key={c.key} href={`/report?category=${c.key}`}>
              <Card className="group h-full p-4 text-center">
                <span className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl border ${c.chip}`}>
                  <Icon name={c.icon} className="h-5 w-5" />
                </span>
                <p className="mt-2.5 text-sm font-semibold text-slate-800 group-hover:text-blue-700">{c.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">How it works</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MapPin, title: "1 · Report", body: "Snap a photo, drop your GPS pin, add one line. Under a minute." },
              { icon: Bot, title: "2 · AI understands", body: "Category, severity, safety risk and duplicates — checked instantly." },
              { icon: Route, title: "3 · Routed & prioritized", body: "Priority engine scores it and routes to your municipality's department." },
              { icon: BadgeCheck, title: "4 · Fixed & verified", body: "Staff attach before/after evidence. Closed only after verification." },
            ].map((s) => (
              <Card key={s.title} className="p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-900">{s.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* recent resolutions */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Recently resolved</h2>
          <Link href="/reports" className="text-sm font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {recentClosed.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center justify-between">
                <Badge className={CATEGORIES.find((x) => x.key === c.category)?.chip ?? ""}>
                  <Icon name={CATEGORIES.find((x) => x.key === c.category)?.icon ?? "CircleHelp"} className="h-3 w-3" />
                  {CATEGORIES.find((x) => x.key === c.category)?.label}
                </Badge>
                <span className="text-xs font-semibold text-emerald-600">★ {c.feedback?.rating}.0</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">{c.title}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3" /> {c.location.label} · closed {fmtRelative(c.updatedAt, MOCK_NOW)}
              </p>
              {c.feedback?.comment && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs italic text-slate-600">
                  “{c.feedback.comment}”
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* trust / ai transparency */}
      <section className="border-t border-slate-200 bg-slate-900 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-3">
          {[
            { t: "Duplicates make cases stronger", b: "If several citizens report the same pothole, reports merge into one case — and the extra voices raise its priority instead of creating paperwork." },
            { t: "AI advises, people decide", b: "AI never closes or prioritizes anything on its own. Municipal staff own every status change, verified in an audit trail." },
            { t: "Nothing gets rejected silently", b: "Suspicious reports get a risk score and human review — genuine issues are never auto-dismissed." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5">
              <p className="text-sm font-bold text-white">{x.t}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{x.b}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
