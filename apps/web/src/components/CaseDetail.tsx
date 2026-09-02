"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Star,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Icon } from "@/components/icons";
import {
  AICard,
  CategoryChip,
  EvidenceGallery,
  LinkedReports,
  PhotoTile,
  PriorityCard,
  RiskCard,
  SLABadge,
  StatusBadge,
  StatusStepper,
  Timeline,
} from "@/components/case";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { InfoNote, ProgressBar } from "@/components/ui/Misc";
import { Modal } from "@/components/ui/Modal";
import {
  ALLOWED_TRANSITIONS,
  CATEGORY_MAP,
  DEPARTMENTS,
  STATUS_META,
} from "@/lib/constants";
import { fmtDateTime, fmtHours, fmtRelative, hoursUntil } from "@/lib/format";
import { MOCK_NOW, MUNI_BY_ID } from "@/lib/mock/data";
import { canManageCases } from "@/lib/personas";
import { useApp } from "@/lib/store";
import type { Case, CaseStatus } from "@/lib/types";

export function CaseDetail({ c, perspective }: { c: Case; perspective: "citizen" | "municipality" }) {
  const { persona, workers, setStatus, assignWorker, addEvidence, verify, reopen, addFeedback } = useApp();
  const [modal, setModal] = useState<null | "assign" | "status" | "evidence">(null);
  const [error, setError] = useState("");
  const canManage =
    canManageCases(persona) &&
    (persona.role === "SUPER_ADMIN" ||
      persona.municipalityId === c.municipalityId ||
      false) &&
    (persona.role !== "DEPARTMENT_ADMIN" || persona.departmentKey === c.departmentKey);

  const allowedNext = ALLOWED_TRANSITIONS[c.status];
  const dept = c.departmentKey ? DEPARTMENTS[c.departmentKey] : null;

  function guard(fn: () => void) {
    setError("");
    try {
      fn();
      setModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Case #{c.caseNumber} · {MUNI_BY_ID[c.municipalityId]?.shortName}
              {dept ? ` · ${dept.name}` : ""}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{c.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={c.status} />
              <CategoryChip category={c.category} />
              <Badge className={`border ${PRIORITY_CLS[c.priority]}`}>{c.priority} priority · {c.priorityScore.total}/100</Badge>
              <SLABadge c={c} />
            </div>
          </div>
          <div className="w-36 shrink-0">
            <PhotoTile category={c.category} className="h-24" label="Primary photo" dataUrl={c.evidence.find((e) => e.photoDataUrl)?.photoDataUrl} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <Meta label="Reported by" value={c.reporter.name} />
          <Meta label="Location" value={`${c.location.label} · ${c.location.lat.toFixed(3)}, ${c.location.lng.toFixed(3)}`} />
          <Meta label="Created" value={`${fmtDateTime(c.createdAt)} (${fmtRelative(c.createdAt, MOCK_NOW)})`} />
          <Meta
            label="SLA"
            value={`${fmtHours(c.sla.hoursAllowed)} target · due ${fmtDateTime(c.sla.dueAt)}${
              c.sla.resolvedAt ? ` · resolved in ${fmtHours((new Date(c.sla.resolvedAt).getTime() - new Date(c.sla.createdAt).getTime()) / 3600000)}` : ""
            }`}
          />
        </div>
      </Card>

      {/* state machine */}
      <Card className="p-5">
        <StatusStepper status={c.status} />
      </Card>

      {/* municipality action bar */}
      {perspective === "municipality" && (
        <Card className="p-5">
          {canManage ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setModal("assign")}>
                  <UserPlus className="h-4 w-4" />
                  {c.assignment ? "Reassign worker" : "Assign worker"}
                </Button>
                {allowedNext.length > 0 && c.status !== "VERIFICATION" && c.status !== "CLOSED" && (
                  <Button size="sm" variant="outline" onClick={() => setModal("status")}>
                    <ArrowLeftRight className="h-4 w-4" /> Change status
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setModal("evidence")}>
                  <Camera className="h-4 w-4" /> Add evidence
                </Button>
                {(c.status === "VERIFICATION" || c.status === "RESOLVED") && (
                  <>
                    <Button size="sm" variant="success" onClick={() => guard(() => verify(c.id, true, "Evidence verified"))}>
                      <CheckCircle2 className="h-4 w-4" /> Approve & close
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => guard(() => verify(c.id, false, "Work incomplete — reopening"))}>
                      <XCircle className="h-4 w-4" /> Reject & reopen
                    </Button>
                  </>
                )}
                {c.status === "CLOSED" && (
                  <Button size="sm" variant="danger" onClick={() => guard(() => reopen(c.id, "Reopened after citizen feedback"))}>
                    <RefreshCw className="h-4 w-4" /> Reopen case
                  </Button>
                )}
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Only legal transitions are offered ({c.status} → {allowedNext.join(" / ") || "terminal"}). The backend
                re-validates every change.
              </p>
            </>
          ) : (
            <InfoNote tone="amber">
              You are viewing as <strong>{persona.label}</strong>. Switch to an authorized Municipality/Department
              admin persona (top-right) to manage this case.
            </InfoNote>
          )}
          {error && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              <AlertTriangle className="h-4 w-4" /> {error}
            </p>
          )}
        </Card>
      )}

      {/* assignment / verification summary for municipality */}
      {perspective === "municipality" && (
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader title="Assignment" subtitle="Workers are managed here — no separate worker app" icon={UserPlus} />
            <div className="px-5 py-4">
              {c.assignment ? (
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                    {c.assignment.workerName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.assignment.workerName}</p>
                    <p className="text-xs text-slate-500">
                      assigned {fmtRelative(c.assignment.assignedAt, MOCK_NOW)} by {c.assignment.assignedBy}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No worker assigned yet.{" "}
                  {canManage ? "Assign one to start field work." : "Awaiting assignment by municipality staff."}
                </p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Verification" subtitle="Evidence reviewed by municipal staff" icon={BadgeCheck} />
            <div className="px-5 py-4">
              {!c.verification && <p className="text-sm text-slate-500">Not yet applicable.</p>}
              {c.verification?.status === "PENDING" && (
                <p className="text-sm font-medium text-cyan-700">Pending review — evidence awaiting verification.</p>
              )}
              {c.verification?.status === "PASSED" && (
                <div className="text-sm">
                  <p className="font-semibold text-emerald-700">Passed</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.verification.method} · by {c.verification.byName} · {fmtRelative(c.verification.at ?? c.updatedAt, MOCK_NOW)}
                  </p>
                  {c.verification.notes && <p className="mt-1 text-xs italic text-slate-400">“{c.verification.notes}”</p>}
                </div>
              )}
              {c.verification?.status === "FAILED" && (
                <div className="text-sm">
                  <p className="font-semibold text-rose-700">Failed — case reopened for rework</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.verification.method} · by {c.verification.byName}
                  </p>
                  {c.verification.notes && <p className="mt-1 text-xs italic text-slate-400">“{c.verification.notes}”</p>}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* AI + priority + risk */}
      <div className="grid gap-5 lg:grid-cols-3">
        <AICard c={c} />
        <PriorityCard c={c} />
        <RiskCard c={c} />
      </div>

      {/* evidence */}
      <Card>
        <CardHeader title="Evidence" subtitle="Before / after documentation" icon={Camera} />
        <div className="px-5 py-4">
          <EvidenceGallery c={c} />
        </div>
      </Card>

      {/* linked reports + timeline */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Linked reports" subtitle="Duplicate detection in action" icon={MessageSquare} />
          <div className="px-5 py-4">
            <LinkedReports reports={c.linkedReports} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Activity timeline" subtitle="Every status change is audited" icon={ArrowLeftRight} />
          <div className="px-5 py-4">
            <Timeline history={c.statusHistory} />
          </div>
        </Card>
      </div>

      {/* citizen feedback */}
      {perspective === "citizen" && c.status === "CLOSED" && <FeedbackSection c={c} onSubmit={(r, cm, ok) => addFeedback(c.id, r, cm, ok)} />}
      {perspective === "citizen" && (c.status === "REJECTED" || c.status === "REOPENED") && (
        <InfoNote tone="rose">
          Verification failed for this case — the municipality has reopened it and work is being redone. You will be
          notified when it is resolved again.
        </InfoNote>
      )}
      {perspective === "citizen" && c.feedback && (
        <Card className="p-5">
          <p className="text-sm font-semibold text-slate-900">Your feedback</p>
          <p className="mt-1 text-sm text-amber-500">
            {"★".repeat(c.feedback.rating)}
            <span className="text-slate-300">{"★".repeat(5 - c.feedback.rating)}</span>
          </p>
          {c.feedback.comment && <p className="mt-1 text-xs italic text-slate-500">“{c.feedback.comment}”</p>}
          <p className="mt-2 text-xs text-slate-400">
            {c.feedback.resolvedConfirmed ? "You confirmed the issue was resolved." : "You reported the issue persists."}
          </p>
        </Card>
      )}

      {/* ── modals ── */}
      {modal === "assign" && (
        <AssignModal
          c={c}
          workers={workers.filter((w) => w.municipalityId === c.municipalityId)}
          onClose={() => setModal(null)}
          onAssign={(wid) => guard(() => assignWorker(c.id, wid))}
        />
      )}
      {modal === "status" && (
        <StatusModal
          c={c}
          onClose={() => setModal(null)}
          onChange={(next, note) => guard(() => setStatus(c.id, next, note))}
        />
      )}
      {modal === "evidence" && (
        <EvidenceModal
          onClose={() => setModal(null)}
          onAdd={(item) => guard(() => addEvidence(c.id, item))}
        />
      )}
    </div>
  );
}

const PRIORITY_CLS: Record<string, string> = {
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-700">{value}</p>
    </div>
  );
}

// ── assign modal ─────────────────────────────────────────────

function AssignModal({
  c,
  workers,
  onClose,
  onAssign,
}: {
  c: Case;
  workers: ReturnType<typeof useApp>["workers"];
  onClose: () => void;
  onAssign: (workerId: string) => void;
}) {
  const { cases } = useApp();
  const [selected, setSelected] = useState(c.assignment?.workerId ?? "");
  const load = (id: string) => cases.filter((x) => x.assignment?.workerId === id && !["CLOSED", "REJECTED"].includes(x.status)).length;
  const list = [...workers].sort((a, b) => (a.departmentKey === c.departmentKey ? -1 : 1) - (b.departmentKey === c.departmentKey ? -1 : 1));

  return (
    <Modal open onClose={onClose} title="Assign field worker" subtitle={`Case #${c.caseNumber} · ${c.location.label}`} wide>
      <div className="space-y-2">
        {list.length === 0 && <p className="text-sm text-slate-500">No workers registered for this municipality.</p>}
        {list.map((w) => {
          const active = load(w.id);
          const match = w.departmentKey === c.departmentKey;
          return (
            <button
              key={w.id}
              disabled={!w.active}
              onClick={() => setSelected(w.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                selected === w.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              } ${!w.active ? "opacity-40" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {w.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {w.name}
                  {match && <Badge className="border-blue-200 bg-blue-50 text-blue-700">dept match</Badge>}
                  {!w.active && <Badge className="border-slate-200 bg-slate-50 text-slate-500">inactive</Badge>}
                </span>
                <span className="block text-xs text-slate-500">
                  {DEPARTMENTS[w.departmentKey].name} · {w.phone}
                </span>
              </span>
              <span className="w-24 shrink-0">
                <span className="mb-1 block text-right text-[10px] text-slate-400">{active} active</span>
                <ProgressBar value={active / 5} className={active >= 4 ? "bg-rose-500" : "bg-blue-500"} height="h-1.5" />
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!selected} onClick={() => onAssign(selected)}>
          <UserPlus className="h-4 w-4" /> Assign
        </Button>
      </div>
    </Modal>
  );
}

// ── status modal ─────────────────────────────────────────────

function StatusModal({ c, onClose, onChange }: { c: Case; onClose: () => void; onChange: (next: CaseStatus, note: string) => void }) {
  const allowed = ALLOWED_TRANSITIONS[c.status];
  const [next, setNext] = useState<CaseStatus | "">(allowed.length === 1 ? allowed[0] : "");
  const [note, setNote] = useState("");
  return (
    <Modal open onClose={onClose} title="Change case status" subtitle={`Current: ${c.status} — only legal transitions shown`}>
      <div className="space-y-2">
        {allowed.map((s) => (
          <button
            key={s}
            onClick={() => setNext(s)}
            className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left ${
              next === s ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${STATUS_META[s].dot}`} />
            <span>
              <span className="block text-sm font-semibold text-slate-900">{STATUS_META[s].label}</span>
              <span className="block text-xs text-slate-500">{STATUS_META[s].help}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <Field label="Note (optional)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / context for this change (audited)" />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button disabled={!next} onClick={() => next && onChange(next, note)}>
          Apply transition
        </Button>
      </div>
    </Modal>
  );
}

// ── evidence modal ───────────────────────────────────────────

function EvidenceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: { type: "BEFORE" | "AFTER" | "NOTE"; note: string; byName: string; photoDataUrl?: string }) => void }) {
  const { persona } = useApp();
  const [type, setType] = useState<"BEFORE" | "AFTER" | "NOTE">("AFTER");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <Modal open onClose={onClose} title="Add evidence" subtitle="Uploaded on behalf of the field worker">
      <div className="space-y-4">
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="BEFORE">BEFORE — condition at start of work</option>
            <option value="AFTER">AFTER — completed work (required to resolve)</option>
            <option value="NOTE">NOTE — site observation</option>
          </Select>
        </Field>
        <Field label="Note" required>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Patched and compacted, road reopened" />
        </Field>
        <Field label="Photo (optional)">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-slate-600 hover:file:bg-slate-200"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const r = new FileReader();
              r.onload = () => setPhoto(String(r.result));
              r.readAsDataURL(f);
            }}
          />
        </Field>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="preview" className="h-32 w-full rounded-xl border border-slate-200 object-cover" />
        )}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!note.trim()} onClick={() => onAdd({ type, note: note.trim(), byName: persona.name, photoDataUrl: photo })}>
            <Camera className="h-4 w-4" /> Attach evidence
          </Button>
        </div>
      </div>
    </Modal>
  );
}


// ── citizen feedback ─────────────────────────────────────────

function FeedbackSection({ c, onSubmit }: { c: Case; onSubmit: (rating: number, comment: string, confirmed: boolean) => void }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [confirmed, setConfirmed] = useState(true);
  const [done, setDone] = useState(false);
  if (done)
    return (
      <Card className="p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" /> Thank you! Your feedback helps prioritize future work.
        </p>
      </Card>
    );
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-slate-900">Was this fixed properly?</p>
      <p className="mt-1 text-xs text-slate-500">
        Your confirmation closes the loop on case #{c.caseNumber}.
      </p>
      <div className="mt-3 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={`h-7 w-7 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment…" />
      </div>
      <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="rounded border-slate-300" />
        I confirm the issue has been resolved
      </label>
      <Button
        className="mt-3"
        disabled={rating === 0}
        onClick={() => {
          onSubmit(rating, comment, confirmed);
          setDone(true);
        }}
      >
        <CheckCircle2 className="h-4 w-4" /> Submit feedback
      </Button>
    </Card>
  );
}
