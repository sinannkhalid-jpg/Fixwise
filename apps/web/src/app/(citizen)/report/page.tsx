"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  Crosshair,
  Link2,
  Loader2,
  MapPin,
  Send,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import { Icon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Form";
import { InfoNote } from "@/components/ui/Misc";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants";
import { MUNICIPALITIES } from "@/lib/mock/data";
import { suggestCategory } from "@/lib/mock/data";
import { useApp } from "@/lib/store";
import type { Category } from "@/lib/types";

const STEPS = ["Describe", "Evidence & location", "Review & submit"] as const;

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportWizard />
    </Suspense>
  );
}

function ReportWizard() {
  const params = useSearchParams();
  const prefill = params.get("category") as Category | null;
  const { createReport, municipalities } = useApp();

  const [step, setStep] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category | null>(prefill && CATEGORY_MAP[prefill] ? prefill : null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasVideo, setHasVideo] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [stage, setStage] = useState<"form" | "pipeline" | "done">("form");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult] = useState<{ outcome: "new_case" | "linked"; caseId: string; caseNumber?: number; linkedCount: number } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const aiSuggestion = useMemo(() => suggestCategory(description), [description]);
  const nearest = useMemo(() => nearestArea(location), [location]);

  function useGps() {
    setGpsLoading(true);
    setTimeout(() => {
      const m = MUNICIPALITIES[0];
      const area = m.areas[Math.floor(Math.random() * m.areas.length)];
      setLocation({
        lat: area.lat + (Math.random() - 0.5) * 0.004,
        lng: area.lng + (Math.random() - 0.5) * 0.004,
        label: area.name,
      });
      setGpsLoading(false);
    }, 700);
  }

  function onFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files)
      .slice(0, 3)
      .forEach((f) => {
        if (!f.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onload = () => setPhotos((prev) => [...prev.slice(0, 2), String(reader.result)]);
        reader.readAsDataURL(f);
      });
  }

  function next() {
    setError("");
    if (step === 0) {
      if (description.trim().length < 10) return setError("Please describe the issue in a little more detail (10+ characters).");
    }
    if (step === 1 && !location) return setError("A location is required — use GPS or tap the map to drop a pin.");
    if (step === 2) return submit();
    setStep(step + 1);
  }

  const PIPELINE = [
    "Uploading evidence to secure storage",
    "AI analysis — category, severity, safety risk",
    "Duplicate check against nearby open reports",
    "Priority engine scoring & municipality routing",
  ];

  function submit() {
    if (!location) return setError("A location is required.");
    setStage("pipeline");
    setPipelineStep(0);
    let i = 0;
    const tick = () => {
      i++;
      if (i < PIPELINE.length) {
        setPipelineStep(i);
        setTimeout(tick, 750);
      } else {
        try {
          const res = createReport({
            description: description.trim(),
            category: category ?? aiSuggestion,
            photos,
            location,
          });
          setResult(res);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setStage("form");
          return;
        }
        setStage("done");
      }
    };
    setTimeout(tick, 750);
  }

  // ── pipeline / done screens ──
  if (stage === "pipeline") {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <Card className="p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Sparkles className="h-5 w-5 text-violet-500" /> Processing your report
          </p>
          <div className="mt-6 space-y-4">
            {PIPELINE.map((p, i) => {
              const state = i < pipelineStep ? "done" : i === pipelineStep ? "active" : "todo";
              return (
                <div key={p} className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      state === "done"
                        ? "bg-emerald-500 text-white"
                        : state === "active"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {state === "done" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : state === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <p className={`text-sm ${state === "todo" ? "text-slate-400" : "font-medium text-slate-800"}`}>{p}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Your report is safely stored before AI runs — if analysis fails it will be retried automatically.
          </p>
        </Card>
      </div>
    );
  }

  if (stage === "done" && result) {
    const linked = result.outcome === "linked";
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="p-8 text-center">
          <span
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
              linked ? "bg-teal-50 text-teal-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {linked ? <Link2 className="h-7 w-7" /> : <CheckCircle2 className="h-7 w-7" />}
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {linked ? "Linked to an existing case" : `Case #${result.caseNumber} created`}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
            {linked
              ? `Another citizen already reported this issue nearby. Your report was linked — ${result.linkedCount} citizens have now reported it, which raises its priority. You'll receive updates on this case.`
              : "Your report was classified by AI, scored by the priority engine and routed to the right municipal department. Track it any time from My Reports."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/reports/${result.caseId}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Track this case <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => {
                setStage("form");
                setStep(0);
                setDescription("");
                setCategory(null);
                setPhotos([]);
                setLocation(null);
                setResult(null);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Report another issue
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ── wizard form ──
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* stepper */}
      <ol className="mb-8 flex items-center gap-2 text-xs font-medium">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={i <= step ? "text-slate-900" : "text-slate-400"}>{s}</span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? "bg-emerald-400" : "bg-slate-200"}`} />}
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {step === 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">What&apos;s the issue?</h2>
          <p className="mt-1 text-sm text-slate-500">
            Describe it in your own words — AI will classify and route it. Category is optional.
          </p>

          <div className="mt-5">
            <Field label="Description" required hint="What, where, and why it matters. E.g. 'Deep pothole near the school gate, two-wheelers swerving into traffic.'">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue…"
                className="min-h-32"
              />
            </Field>
            {aiSuggestion && description.length > 12 && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-xs text-violet-800">
                <Bot className="h-4 w-4 shrink-0" />
                <span className="flex-1">
                  AI suggests: <strong>{CATEGORY_MAP[aiSuggestion].label}</strong>
                </span>
                {category !== aiSuggestion && (
                  <Button size="sm" variant="outline" onClick={() => setCategory(aiSuggestion)}>
                    Apply
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-slate-700">Category (optional)</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(category === c.key ? null : c.key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === c.key
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon name={c.icon} className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Photo evidence</h2>
            <p className="mt-1 text-sm text-slate-500">A photo dramatically improves AI accuracy and verification. Up to 3 images.</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {photos.map((p, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`Upload ${i + 1}`} className="h-28 w-full object-cover" />
                  <button
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute right-1.5 top-1.5 rounded-lg bg-slate-900/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-colors hover:border-blue-400 hover:text-blue-500"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs font-medium">Add photo</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            <label className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={hasVideo} onChange={(e) => setHasVideo(e.target.checked)} className="rounded border-slate-300" />
              <Video className="h-3.5 w-3.5" /> I also have a video (attach via the app later)
            </label>
          </Card>

          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-blue-600" /> Where is it?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              GPS determines which municipality receives the case. Tap the map to adjust the pin.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={useGps} disabled={gpsLoading}>
                {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                Use my GPS location
              </Button>
              {location && (
                <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)} · {nearest}
                </Badge>
              )}
            </div>

            <div className="mt-4">
              <LocationPicker
                value={location}
                onChange={(lat, lng) => {
                  const area = nearestArea({ lat, lng });
                  setLocation({ lat, lng, label: area });
                }}
              />
            </div>
            {location && (
              <div className="mt-3">
                <Field label="Nearby landmark (optional)">
                  <Input
                    value={location.label}
                    onChange={(e) => setLocation({ ...location, label: e.target.value })}
                    placeholder="e.g. near the school gate"
                  />
                </Field>
              </div>
            )}
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900">Review & submit</h2>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex gap-4 py-3">
              <dt className="w-32 shrink-0 text-slate-500">Description</dt>
              <dd className="text-slate-800">{description}</dd>
            </div>
            <div className="flex gap-4 py-3">
              <dt className="w-32 shrink-0 text-slate-500">Category</dt>
              <dd>
                {category ?? aiSuggestion ? (
                  <Badge className={CATEGORY_MAP[(category ?? aiSuggestion)!].chip}>
                    <Icon name={CATEGORY_MAP[(category ?? aiSuggestion)!].icon} className="h-3 w-3" />
                    {CATEGORY_MAP[(category ?? aiSuggestion)!].label}
                    {category === null && aiSuggestion ? " (AI)" : ""}
                  </Badge>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex gap-4 py-3">
              <dt className="w-32 shrink-0 text-slate-500">Photos</dt>
              <dd className="flex gap-2">
                {photos.length ? (
                  photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={p} alt="" className="h-14 w-14 rounded-lg border border-slate-200 object-cover" />
                  ))
                ) : (
                  <span className="text-slate-400">none</span>
                )}
              </dd>
            </div>
            <div className="flex gap-4 py-3">
              <dt className="w-32 shrink-0 text-slate-500">Location</dt>
              <dd className="text-slate-800">
                {location ? `${location.label} · ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "—"}
                <span className="block text-xs text-slate-400">
                  routes to {nearestMunicipality(location)?.name ?? "—"}
                </span>
              </dd>
            </div>
          </dl>
          <InfoNote tone="blue">
            On submit: AI classifies and checks for duplicates → the priority engine scores the case → it&apos;s routed
            to the right municipality and department. If anything fails, the report is still stored and retried.
          </InfoNote>
        </Card>
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={next} size="lg">
          {step === 2 ? (
            <>
              Submit report <Send className="h-4 w-4" />
            </>
          ) : (
            <>
              Continue <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── location picker (compact clickable map) ──────────────────

function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const W = 640;
  const H = 300;
  const center = MUNICIPALITIES[0].center;
  const spanKm = 22;
  const kmLat = 111.32;
  const kmLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
  const px = (lng: number) => W / 2 + ((lng - center.lng) * kmLng / spanKm) * (W * 0.9);
  const py = (lat: number) => H / 2 - ((lat - center.lat) * kmLat / spanKm) * (H * 0.9);

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const lng = center.lng + ((x - W / 2) / (W * 0.9)) * (spanKm / kmLng);
    const lat = center.lat - ((y - H / 2) / (H * 0.9)) * (spanKm / kmLat);
    onChange(lat, lng);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full cursor-crosshair bg-slate-50" onClick={handleClick} role="img" aria-label="Tap to set location">
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`v${i}`} x1={(i * W) / 11} y1="0" x2={(i * W) / 11} y2={H} stroke="#e2e8f0" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i * H) / 5} x2={W} y2={(i * H) / 5} stroke="#e2e8f0" />
        ))}
        <path d={`M 20 260 C 180 220, 240 120, 420 110 C 520 100, 560 40, 630 30`} fill="none" stroke="#bae6fd" strokeWidth="14" opacity="0.6" />
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#cbd5e1" strokeWidth="4" opacity="0.5" />
        {MUNICIPALITIES[0].areas.map((a) => (
          <circle key={a.name} cx={px(a.lng)} cy={py(a.lat)} r="3" fill="#94a3b8">
            <title>{a.name}</title>
          </circle>
        ))}
        {value && (
          <g>
            <circle cx={px(value.lng)} cy={py(value.lat)} r="16" fill="#2563eb" opacity="0.2" />
            <circle cx={px(value.lng)} cy={py(value.lat)} r="8" fill="#2563eb" stroke="#fff" strokeWidth="3" />
          </g>
        )}
      </svg>
    </div>
  );
}

function nearestArea(loc: { lat: number; lng: number } | null): string {
  if (!loc) return "";
  let best = { name: "", d: Infinity };
  for (const m of MUNICIPALITIES)
    for (const a of m.areas) {
      const d = Math.hypot(a.lat - loc.lat, a.lng - loc.lng);
      if (d < best.d) best = { name: a.name, d };
    }
  return best.name;
}

function nearestMunicipality(loc: { lat: number; lng: number } | null) {
  if (!loc) return null;
  let best = null as null | { name: string; d: number };
  for (const m of MUNICIPALITIES) {
    const d = Math.hypot(m.center.lat - loc.lat, m.center.lng - loc.lng);
    if (!best || d < best.d) best = { name: m.name, d };
  }
  return best ? { name: best.name } : null;
}
