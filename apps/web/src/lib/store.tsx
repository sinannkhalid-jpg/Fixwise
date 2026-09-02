"use client";

// ── App store (mock backend) ─────────────────────────────────
// Every action here mirrors an endpoint in docs/api-contract.md.
// At integration time, replace the mutation bodies with fetch() calls —
// pages/components should not need to change.

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  ALLOWED_TRANSITIONS,
  CATEGORY_MAP,
  DEPT_FOR_CATEGORY,
  PRIORITY_SLA_HOURS,
  computePriorityScore,
  priorityFromScore,
  riskActionFromLevel,
  riskLevelFromScore,
} from "@/lib/constants";
import {
  AI_INSIGHTS,
  AUDIT_LOGS,
  CASES,
  CITIZENS,
  DEPARTMENTS,
  MUNICIPALITIES,
  MUNI_BY_ID,
  NOTIFICATIONS,
  RECURRING_PROBLEMS,
  suggestCategory,
  WORKERS,
} from "@/lib/mock/data";
import { PERSONAS } from "@/lib/personas";
import type {
  AIAnalysis,
  Area,
  AuditLog,
  Case,
  CaseStatus,
  Department,
  EvidenceItem,
  Municipality,
  Notification,
  Persona,
  PriorityScore,
  RecurringProblem,
  RecurringStatus,
  ReportDraft,
  RiskAssessment,
  SLARecord,
  Worker,
} from "@/lib/types";

export interface CreateReportResult {
  outcome: "new_case" | "linked";
  caseId: string;
  caseNumber?: number;
  linkedCount: number;
  duplicateOfTitle?: string;
}

interface AppApi {
  // data
  municipalities: Municipality[];
  departments: Department[];
  workers: Worker[];
  cases: Case[];
  notifications: Notification[];
  recurringProblems: RecurringProblem[];
  insights: typeof AI_INSIGHTS;
  auditLogs: AuditLog[];
  // session
  persona: Persona;
  activeMunicipalityId: string;
  setPersona: (p: Persona) => void;
  setActiveMunicipalityId: (id: string) => void;
  // case ops
  createReport: (draft: ReportDraft) => CreateReportResult;
  setStatus: (caseId: string, next: CaseStatus, note?: string) => void;
  assignWorker: (caseId: string, workerId: string) => void;
  addEvidence: (caseId: string, item: Omit<EvidenceItem, "id" | "at">) => void;
  verify: (caseId: string, pass: boolean, notes: string) => void;
  reopen: (caseId: string, reason: string) => void;
  addFeedback: (caseId: string, rating: number, comment: string, resolvedConfirmed: boolean) => void;
  // workers
  addWorker: (name: string, phone: string, departmentKey: Worker["departmentKey"], municipalityId: string) => void;
  toggleWorker: (workerId: string) => void;
  // recurring problems
  setRecurringStatus: (id: string, status: RecurringStatus) => void;
  // notifications
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const Ctx = createContext<AppApi | null>(null);

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const NOW = () => new Date().toISOString();

export function AppProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>(() => CASES);
  const [workers, setWorkers] = useState<Worker[]>(() => WORKERS);
  const [notifications, setNotifications] = useState<Notification[]>(() => NOTIFICATIONS);
  const [recurringProblems, setRecurringProblems] = useState<RecurringProblem[]>(() => RECURRING_PROBLEMS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => AUDIT_LOGS);
  const [persona, setPersonaState] = useState<Persona>(() => PERSONAS[0]);
  const [activeMunicipalityId, setActiveMunicipalityId] = useState<string>("m-pmc");

  const sessionRole = persona.role;
  const audience: Notification["audience"] =
    sessionRole === "CITIZEN" ? "citizen" : sessionRole === "SUPER_ADMIN" ? "super" : "muni-admin";

  function audit(actor: string, action: string, detail: string) {
    setAuditLogs((prev) => [{ id: uid("a"), at: NOW(), actor, action, detail }, ...prev].slice(0, 200));
  }

  function notify(title: string, body: string, caseId?: string) {
    setNotifications((prev) => [{ id: uid("n"), audience, title, body, at: NOW(), read: false, caseId }, ...prev].slice(0, 60));
  }

  function setPersona(p: Persona) {
    setPersonaState(p);
    if (p.municipalityId) setActiveMunicipalityId(p.municipalityId);
  }

  // ── authorization (mirror of backend RBAC) ──
  function assertCanManage(c: Case) {
    const p = persona;
    if (p.role === "SUPER_ADMIN") return;
    if (p.role === "MUNICIPALITY_ADMIN" && p.municipalityId === c.municipalityId) return;
    if (p.role === "DEPARTMENT_ADMIN" && p.municipalityId === c.municipalityId && p.departmentKey === c.departmentKey)
      return;
    throw new Error(`Not authorized: your role (${p.role}) cannot manage cases in this scope.`);
  }

  function recomputePriority(c: Case): { priority: Case["priority"]; priorityScore: PriorityScore } {
    const area = MUNI_BY_ID[c.municipalityId]?.areas.find((a) => a.name === c.location.label);
    const ageDays = Math.max(0, (Date.now() - new Date(c.createdAt).getTime()) / 86400000);
    const ps = computePriorityScore({
      severity: c.ai.severity,
      safetyRisk: c.ai.safetyRisk,
      linkedReports: c.linkedReports.length,
      locationImportance: area?.imp ?? 5,
      ageDays,
      publicImpact: Math.min(10, (c.linkedReports.length - 1) * 2 + c.ai.severity * 5),
    });
    return { priority: priorityFromScore(ps.total), priorityScore: ps };
  }

  function recomputeSla(c: Case, priority: Case["priority"]): SLARecord {
    const hours = PRIORITY_SLA_HOURS[priority];
    const created = new Date(c.sla.createdAt).getTime();
    const dueAt = created + hours * 3600000;
    const resolved = c.sla.resolvedAt ? new Date(c.sla.resolvedAt).getTime() : null;
    const breached = resolved ? resolved > dueAt : Date.now() > dueAt;
    const status: SLARecord["status"] = resolved || c.status === "CLOSED"
      ? breached ? "BREACHED" : "MET"
      : Date.now() > dueAt ? "BREACHED" : dueAt - Date.now() < hours * 0.25 * 3600000 ? "AT_RISK" : "ON_TRACK";
    return { ...c.sla, dueAt: new Date(dueAt).toISOString(), hoursAllowed: hours, breached, status };
  }

  // ── REPORT → pipeline (mirrors backend flow, mock AI) ──
  function createReport(draft: ReportDraft): CreateReportResult {
    if (!draft.description.trim()) throw new Error("Description is required.");
    if (!draft.location) throw new Error("Location is required.");

    const category = draft.category ?? suggestCategory(draft.description) ?? "OTHER";
    const severity = 0.3 + Math.random() * 0.6;
    const safetyRisk = Math.min(1, severity * (0.7 + Math.random() * 0.4));
    const confidence = 0.6 + Math.random() * 0.38;
    const deptKey = DEPT_FOR_CATEGORY[category];

    // municipality from GPS (mock point-in-polygon: nearest municipality center)
    let muni = MUNICIPALITIES[0];
    let best = Number.POSITIVE_INFINITY;
    for (const m of MUNICIPALITIES) {
      const d = Math.hypot(m.center.lat - draft.location.lat, m.center.lng - draft.location.lng);
      if (d < best) {
        best = d;
        muni = m;
      }
    }

    const now = Date.now();

    // duplicate detection: same muni+category, open, ≤1.2km, ≤14 days
    const dup = cases.find((c) => {
      if (c.municipalityId !== muni.id || c.category !== category) return false;
      if (["CLOSED", "REJECTED"].includes(c.status)) return false;
      const km = Math.hypot(
        (c.location.lat - draft.location.lat) * 111,
        (c.location.lng - draft.location.lng) * 103
      );
      const ageDays = Math.abs(now - new Date(c.createdAt).getTime()) / 86400000;
      return km < 1.2 && ageDays < 14;
    });

    const riskScore = Math.floor(Math.random() * 25);
    const risk: RiskAssessment = {
      score: riskScore,
      level: riskLevelFromScore(riskScore),
      action: riskActionFromLevel(riskLevelFromScore(riskScore)),
      reasons: [],
    };

    if (dup) {
      const dupTitle = dup.title;
      let updated: Case | null = null;
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== dup.id) return c;
          const linkedReports = [
            ...c.linkedReports,
            {
              id: uid("r"),
              citizenId: persona.userId,
              citizenName: persona.name,
              description: draft.description,
              createdAt: NOW(),
              hasPhoto: draft.photos.length > 0,
              riskScore,
              riskLevel: risk.level,
            },
          ];
          const { priority, priorityScore } = recomputePriority({ ...c, linkedReports });
          const sla = recomputeSla({ ...c, linkedReports }, priority);
          updated = { ...c, linkedReports, priority, priorityScore, sla, updatedAt: NOW() };
          return updated;
        })
      );
      audit(persona.name, "DUPLICATE_LINKED", `Report linked as duplicate of case #${dup.caseNumber}`);
      notify("Your report was linked to an existing case", `Another citizen already reported this. Your report strengthens case #${dup.caseNumber} — you'll receive its updates.`, dup.id);
      return { outcome: "linked", caseId: dup.id, linkedCount: dup.linkedReports.length + 1, duplicateOfTitle: dupTitle };
    }

    const area = muni.areas.reduce((bestA: Area, a: Area) => {
      const d = Math.hypot(a.lat - draft.location.lat, a.lng - draft.location.lng);
      const bd = Math.hypot(bestA.lat - draft.location.lat, bestA.lng - draft.location.lng);
      return d < bd ? a : bestA;
    }, muni.areas[0]);

    const ai: AIAnalysis = {
      category,
      severity,
      safetyRisk,
      confidence,
      recommendedDepartment: deptKey,
      summary: `${CATEGORY_MAP[category].label} detected near ${area.name}. ${
        severity > 0.7 ? "High" : severity > 0.4 ? "Moderate" : "Low"
      } severity with ${safetyRisk > 0.6 ? "significant safety risk" : "limited immediate safety risk"}.`,
      model: "gemma-2 / gemini-flash (mock)",
      analyzedAt: NOW(),
      duplicateOfCaseId: null,
      duplicateProbability: Math.random() * 0.35,
    };

    const ps = computePriorityScore({
      severity,
      safetyRisk,
      linkedReports: 1,
      locationImportance: area.imp,
      ageDays: 0,
      publicImpact: Math.round(severity * 5),
    });
    const priority = priorityFromScore(ps.total);
    const sla = recomputeSla(
      { ...EMPTY_SLA, createdAt: NOW() } as unknown as Case,
      priority
    );

    const caseNumber = Math.max(...cases.map((c) => c.caseNumber)) + 1;
    const newCase: Case = {
      id: `c-${caseNumber}`,
      caseNumber,
      title: draft.description.length > 60 ? `${draft.description.slice(0, 57)}…` : draft.description,
      description: draft.description,
      category,
      status: "ASSIGNED",
      priority,
      priorityScore: ps,
      municipalityId: muni.id,
      departmentKey: deptKey,
      location: { ...draft.location, label: area.name },
      reporter: { id: persona.userId, name: persona.name },
      linkedReports: [
        {
          id: uid("r"),
          citizenId: persona.userId,
          citizenName: persona.name,
          description: draft.description,
          createdAt: NOW(),
          hasPhoto: draft.photos.length > 0,
          riskScore,
          riskLevel: risk.level,
        },
      ],
      ai,
      risk,
      sla,
      statusHistory: [
        { status: "REPORTED", at: NOW(), byName: persona.name, byRole: "CITIZEN" },
        { status: "ANALYZING", at: NOW(), byName: "Fixwise AI", byRole: "SYSTEM" },
        {
          status: "ASSIGNED",
          at: NOW(),
          byName: "Auto-routing",
          byRole: "SYSTEM",
          note: `Routed to ${MUNI_BY_ID[muni.id].shortName} · ${deptKey}`,
        },
      ],
      assignment: null,
      evidence: draft.photos.length
        ? [{ id: uid("e"), type: "BEFORE", note: "Citizen photo evidence", at: NOW(), byName: persona.name, photoDataUrl: draft.photos[0] }]
        : [],
      verification: null,
      feedback: null,
      createdAt: NOW(),
      updatedAt: NOW(),
    };

    setCases((prev) => [newCase, ...prev]);
    audit(persona.name, "INCIDENT_CREATED", `Case #${caseNumber} · ${category} · ${priority}`);
    notify("Report received", `Case #${caseNumber} created and routed to ${MUNI_BY_ID[muni.id].shortName} (${CATEGORY_MAP[category].label} → ${deptKey}).`, newCase.id);
    setNotifications((prev) => [
      {
        id: uid("n"),
        audience: "muni-admin",
        title: "New report",
        body: `New ${CATEGORY_MAP[category].label} report in ${area.name} — priority ${priority}.`,
        at: NOW(),
        read: false,
        caseId: newCase.id,
      },
      ...prev,
    ]);
    return { outcome: "new_case", caseId: newCase.id, caseNumber, linkedCount: 1 };
  }

  const EMPTY_SLA = { sla: { createdAt: NOW(), dueAt: NOW(), hoursAllowed: 0, breached: false, status: "ON_TRACK" as const, resolvedAt: null } };

  function updateCase(caseId: string, fn: (c: Case) => Case): Case | null {
    let found: Case | null = null;
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const next = { ...fn({ ...c }), updatedAt: NOW() };
        found = next;
        return next;
      })
    );
    return found;
  }

  // ── status state machine (backend is authoritative; we mirror the rules) ──
  function setStatus(caseId: string, next: CaseStatus, note?: string) {
    const c = cases.find((x) => x.id === caseId);
    if (!c) throw new Error("Case not found.");
    assertCanManage(c);
    const allowed = ALLOWED_TRANSITIONS[c.status];
    if (!allowed.includes(next))
      throw new Error(`Invalid transition: ${c.status} → ${next} is not allowed by the state machine.`);
    if (next === "RESOLVED" && !c.evidence.some((e) => e.type === "AFTER"))
      throw new Error("Completion evidence (AFTER photo/note) is required before resolving a case.");
    if (next === "VERIFICATION" && !c.evidence.some((e) => e.type === "AFTER"))
      throw new Error("Evidence required before requesting verification.");

    updateCase(caseId, (cc) => {
      const verification =
        next === "VERIFICATION"
          ? { status: "PENDING" as const, method: "PHOTO" as const, byName: null, at: null, notes: "" }
          : next === "CLOSED"
            ? { status: "PASSED" as const, method: "PHOTO" as const, byName: persona.name, at: NOW(), notes: note ?? "Verified" }
            : next === "REJECTED"
              ? { status: "FAILED" as const, method: "INSPECTION" as const, byName: persona.name, at: NOW(), notes: note ?? "Verification failed" }
              : cc.verification;
      const sla =
        next === "RESOLVED"
          ? { ...cc.sla, resolvedAt: NOW(), status: (new Date(NOW()).getTime() > new Date(cc.sla.dueAt).getTime() ? "BREACHED" : "MET") as SLARecord["status"] }
          : cc.sla;
      return {
        ...cc,
        status: next,
        verification,
        sla,
        statusHistory: [...cc.statusHistory, { status: next, at: NOW(), byName: persona.name, byRole: persona.role, note }],
      };
    });
    audit(persona.name, "STATUS_CHANGE", `Case #${c.caseNumber} → ${next}${note ? ` (${note})` : ""}`);
    notify("Case status updated", `Case #${c.caseNumber} is now ${next.replaceAll("_", " ")}.`, caseId);
  }

  function assignWorker(caseId: string, workerId: string) {
    const c = cases.find((x) => x.id === caseId);
    if (!c) throw new Error("Case not found.");
    assertCanManage(c);
    const w = workers.find((x) => x.id === workerId);
    if (!w) throw new Error("Worker not found.");
    if (!w.active) throw new Error("Worker is inactive — activate before assigning.");
    if (w.municipalityId !== c.municipalityId) throw new Error("Worker belongs to a different municipality.");

    updateCase(caseId, (cc) => {
      const status: CaseStatus = ["REPORTED", "ANALYZING"].includes(cc.status) ? "ASSIGNED" : cc.status;
      const history = status !== cc.status
        ? [...cc.statusHistory, { status, at: NOW(), byName: persona.name, byRole: persona.role, note: `Assigned to ${w.name}` }]
        : cc.statusHistory;
      return {
        ...cc,
        status,
        assignment: { workerId, workerName: w.name, assignedAt: NOW(), assignedBy: persona.name },
        statusHistory: history,
      };
    });
    audit(persona.name, "ASSIGNMENT", `Case #${c.caseNumber} assigned to ${w.name}`);
    notify("Worker assigned", `${w.name} assigned to case #${c.caseNumber}.`, caseId);
  }

  function addEvidence(caseId: string, item: Omit<EvidenceItem, "id" | "at">) {
    const c = cases.find((x) => x.id === caseId);
    if (!c) throw new Error("Case not found.");
    assertCanManage(c);
    updateCase(caseId, (cc) => ({
      ...cc,
      evidence: [...cc.evidence, { ...item, id: uid("e"), at: NOW() }],
    }));
    audit(persona.name, "EVIDENCE_ADDED", `Case #${c.caseNumber}: ${item.type}`);
  }

  function verify(caseId: string, pass: boolean, notes: string) {
    const c = cases.find((x) => x.id === caseId);
    if (!c) throw new Error("Case not found.");
    assertCanManage(c);
    if (c.status !== "VERIFICATION" && c.status !== "RESOLVED")
      throw new Error("Verification is only possible after the case is resolved.");
    if (!c.evidence.some((e) => e.type === "AFTER"))
      throw new Error("No completion evidence to verify.");
    setStatus(caseId, pass ? "CLOSED" : "REJECTED", notes);
  }

  function reopen(caseId: string, reason: string) {
    const c = cases.find((x) => x.id === caseId);
    if (!c) throw new Error("Case not found.");
    assertCanManage(c);
    if (c.status !== "CLOSED") throw new Error("Only closed cases can be reopened.");
    setStatus(caseId, "REOPENED", reason);
  }

  function addFeedback(caseId: string, rating: number, comment: string, resolvedConfirmed: boolean) {
    const c = cases.find((x) => x.id === caseId);
    if (!c) throw new Error("Case not found.");
    if (persona.userId !== c.reporter.id && persona.role === "CITIZEN")
      throw new Error("Only the reporting citizen can leave feedback.");
    updateCase(caseId, (cc) => ({
      ...cc,
      feedback: { rating, comment, resolvedConfirmed, at: NOW() },
    }));
    notify("Feedback recorded", `Thank you! Your feedback on case #${c.caseNumber} was recorded.`, caseId);
  }

  function addWorker(name: string, phone: string, departmentKey: Worker["departmentKey"], municipalityId: string) {
    if (persona.role !== "MUNICIPALITY_ADMIN" && persona.role !== "SUPER_ADMIN")
      throw new Error("Only municipality administrators can add workers.");
    const id = uid("w");
    setWorkers((prev) => [...prev, { id, name, phone, departmentKey, municipalityId, active: true }]);
    audit(persona.name, "WORKER_CREATED", `${name} (${departmentKey}, ${municipalityId})`);
  }

  function toggleWorker(workerId: string) {
    if (persona.role !== "MUNICIPALITY_ADMIN" && persona.role !== "SUPER_ADMIN")
      throw new Error("Only municipality administrators can change worker status.");
    const w = workers.find((x) => x.id === workerId);
    if (!w) return;
    setWorkers((prev) => prev.map((x) => (x.id === workerId ? { ...x, active: !x.active } : x)));
    audit(persona.name, "WORKER_UPDATED", `${w.name} → ${w.active ? "inactive" : "active"}`);
  }

  function setRecurringStatus(id: string, status: RecurringStatus) {
    setRecurringProblems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => (n.audience === audience ? { ...n, read: true } : n)));
  }

  const value: AppApi = {
    municipalities: MUNICIPALITIES,
    departments: DEPARTMENTS,
    workers,
    cases,
    notifications,
    recurringProblems,
    insights: AI_INSIGHTS,
    auditLogs,
    persona,
    activeMunicipalityId,
    setPersona,
    setActiveMunicipalityId,
    createReport,
    setStatus,
    assignWorker,
    addEvidence,
    verify,
    reopen,
    addFeedback,
    addWorker,
    toggleWorker,
    setRecurringStatus,
    markRead,
    markAllRead,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export { CITIZENS };
