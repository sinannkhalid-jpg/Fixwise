// Deterministic mock database — seeded PRNG so server & client renders match.
// Swap point for the real API: src/lib/store.tsx (see docs/api-contract.md).

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
import type {
  AIAnalysis,
  AIInsight,
  Area,
  AuditLog,
  Case,
  CaseStatus,
  Category,
  Citizen,
  Department,
  DepartmentKey,
  EvidenceItem,
  LinkedReport,
  Municipality,
  Notification,
  PriorityScore,
  RecurringProblem,
  RiskAssessment,
  SLARecord,
  SLAStatus,
  StatusEvent,
  Verification,
  Worker,
} from "@/lib/types";

export const MOCK_NOW = new Date("2026-09-02T04:30:00Z"); // 10:00 IST, Sep 2 2026

// ── PRNG ─────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x46495857); // "FIXWX"
const ri = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const rf = (min: number, max: number) => min + rnd() * (max - min);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
function pickW<T>(items: { v: T; w: number }[]): T {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = rnd() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.v;
  }
  return items[items.length - 1].v;
}
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const HOUR = 3600000;
const DAY = 24 * HOUR;
const iso = (t: number) => new Date(t).toISOString();

// ── Municipalities ───────────────────────────────────────────

export const MUNICIPALITIES: Municipality[] = [
  {
    id: "m-pmc",
    name: "Pune Municipal Corporation",
    shortName: "PMC",
    center: { lat: 18.5204, lng: 73.8567 },
    areas: [
      { name: "Shivajinagar", lat: 18.5301, lng: 73.8447, imp: 10 },
      { name: "FC Road", lat: 18.5223, lng: 73.8421, imp: 8 },
      { name: "Kothrud", lat: 18.5074, lng: 73.8077, imp: 6 },
      { name: "Baner", lat: 18.5590, lng: 73.7756, imp: 7 },
      { name: "Aundh", lat: 18.5636, lng: 73.8077, imp: 6 },
      { name: "Hinjewadi Phase 1", lat: 18.5913, lng: 73.7399, imp: 7 },
      { name: "Viman Nagar", lat: 18.5621, lng: 73.9166, imp: 7 },
      { name: "Kharadi", lat: 18.5512, lng: 73.9460, imp: 8 },
      { name: "Hadapsar", lat: 18.5001, lng: 73.9263, imp: 6 },
      { name: "Warje", lat: 18.4832, lng: 73.8224, imp: 5 },
      { name: "Yerawada", lat: 18.5546, lng: 73.8771, imp: 6 },
      { name: "Sahakar Nagar", lat: 18.4871, lng: 73.8412, imp: 5 },
    ],
  },
  {
    id: "m-pcmc",
    name: "Pimpri-Chinchwad Municipal Corporation",
    shortName: "PCMC",
    center: { lat: 18.6298, lng: 73.7997 },
    areas: [
      { name: "Pimpri", lat: 18.6298, lng: 73.7997, imp: 8 },
      { name: "Chinchwad", lat: 18.6353, lng: 73.7984, imp: 7 },
      { name: "Nigdi", lat: 18.6512, lng: 73.7716, imp: 6 },
      { name: "Bhosari", lat: 18.6331, lng: 73.7634, imp: 7 },
      { name: "Wakad", lat: 18.5988, lng: 73.7627, imp: 7 },
      { name: "Ravet", lat: 18.6014, lng: 73.7403, imp: 5 },
    ],
  },
  {
    id: "m-nmc",
    name: "Nashik Municipal Corporation",
    shortName: "NMC",
    center: { lat: 19.9975, lng: 73.7898 },
    areas: [
      { name: "College Road", lat: 19.9974, lng: 73.7898, imp: 8 },
      { name: "CBS", lat: 20.0090, lng: 73.7910, imp: 8 },
      { name: "Ganjamal", lat: 20.0102, lng: 73.8003, imp: 6 },
      { name: "Indira Nagar", lat: 19.9950, lng: 73.8035, imp: 5 },
      { name: "Nashik Road", lat: 19.9901, lng: 73.8200, imp: 7 },
      { name: "Panchavati", lat: 20.0170, lng: 73.8001, imp: 6 },
    ],
  },
];

export const MUNI_BY_ID: Record<string, Municipality> = Object.fromEntries(
  MUNICIPALITIES.map((m) => [m.id, m])
);

const MUNI_ADMIN_NAMES: Record<string, string> = {
  "m-pmc": "Rahul Kulkarni",
  "m-pcmc": "Vikas Jadhav",
  "m-nmc": "Sanika Bhoir",
};

// ── Departments & workers ────────────────────────────────────

const DEPT_KEYS: DepartmentKey[] = [
  "roads",
  "water",
  "electrical",
  "sanitation",
  "drainage",
  "traffic",
  "infrastructure",
];
const DEPT_HEADS: Record<DepartmentKey, string> = {
  roads: "Prasad Deshmukh",
  water: "Kavita More",
  electrical: "Amit Rane",
  sanitation: "Farhan Shaikh",
  drainage: "Nilesh Gaikwad",
  traffic: "Pooja Kale",
  infrastructure: "Manoj Verma",
};

export const DEPARTMENTS: Department[] = MUNICIPALITIES.flatMap((m) =>
  DEPT_KEYS.map((key) => ({
    id: `${m.id}-d-${key}`,
    municipalityId: m.id,
    key,
    name: DEPT_HEADS[key] ? deptName(key) : key,
    head: DEPT_HEADS[key],
  }))
);

function deptName(key: DepartmentKey): string {
  return (
    {
      roads: "Roads",
      water: "Water",
      electrical: "Electrical",
      sanitation: "Sanitation",
      drainage: "Drainage",
      traffic: "Traffic",
      infrastructure: "Parks & Infrastructure",
    } as Record<DepartmentKey, string>
  )[key];
}

const WORKER_NAMES = [
  "Ravi Shinde", "Sunil Pawar", "Ganesh Thorat", "Mahesh Sable", "Dattatrey Kadam",
  "Sagar Bhosale", "Nitin Wagh", "Ajinkya Mehta", "Tushar Kale", "Prakash Chavan",
  "Balu Patil", "Vijay Kamble", "Ramesh Nikam", "Deepak Sonawane", "Kiran Bhalerao",
  "Sanjay Gunjal", "Akash Deore", "Yogesh Aher",
];

export const WORKERS: Worker[] = (() => {
  const out: Worker[] = [];
  let n = 0;
  for (const m of MUNICIPALITIES) {
    const count = m.id === "m-pcmc" ? 6 : 7;
    for (let i = 0; i < count; i++) {
      const dept = DEPT_KEYS[(i + n) % DEPT_KEYS.length];
      out.push({
        id: `w-${m.id.slice(2)}-${i + 1}`,
        name: WORKER_NAMES[(n * 3 + i) % WORKER_NAMES.length],
        phone: `+91 98${ri(10, 99)}${ri(100000, 999999)}`,
        departmentKey: dept,
        municipalityId: m.id,
        active: rnd() > 0.12,
      });
    }
    n++;
  }
  return out;
})();

// ── Citizens ─────────────────────────────────────────────────

const CITIZEN_NAMES = [
  "Ananya Sharma", "Rohan Mehta", "Sneha Joshi", "Imran Khan", "Ketaki Deshpande",
  "Aditya Naik", "Prajakta Bhosale", "Manav Bhatt", "Shreya Kulkarni", "Tanmay Rane",
  "Rutuja Patil", "Omkar Deshmukh", "Farida Qureshi", "Nikhil Sabnis", "Vaishnavi More",
  "Siddharth Kamat", "Aishwarya Nair", "Ritesh Agarwal", "Pooja Vaidya", "Chinmay Dhat",
];

export const CITIZENS: Citizen[] = CITIZEN_NAMES.map((name, i) => ({
  id: i === 0 ? "u-me" : `u-${String(i + 1).padStart(2, "0")}`,
  name,
}));

// ── Text templates ───────────────────────────────────────────

const TITLES: Record<Category, string[]> = {
  POTHOLE: ["Large pothole on {a} road", "Deep pothole near {a} junction", "Crater-sized pothole at {a}"],
  ROAD_DAMAGE: ["Broken footpath on {a}", "Crumbled road surface near {a}", "Speed-breaker damaged at {a}"],
  FLOODING: ["Waterlogging on {a} after rain", "Street flooded near {a}", "Rain water not draining at {a}"],
  DRAINAGE: ["Open/blocked drain at {a}", "Drain overflow near {a}", "Sewage smell from drain at {a}"],
  GARBAGE: ["Garbage pile on {a}", "No waste pickup in {a}", "Illegal dumping near {a}"],
  STREETLIGHT: ["Streetlight not working at {a}", "Dark stretch on {a}", "3 streetlights dead near {a}"],
  WATER_LEAK: ["Water leak on {a}", "Pipeline burst near {a}", "Continuous water wastage at {a}"],
  TRAFFIC_SIGNAGE: ["Fallen signboard at {a}", "Traffic signal dead on {a}", "Missing speed limit sign near {a}"],
  INFRASTRUCTURE: ["Broken bench in {a} park", "Damaged park fence at {a}", "Fallen tree branch at {a}"],
  OTHER: ["Civic issue at {a}", "Public hazard near {a}", "Maintenance needed at {a}"],
};

const BODIES: Record<Category, string[]> = {
  POTHOLE: [
    "Very deep pothole in the left lane. Two-wheelers are swerving into oncoming traffic to avoid it. Someone will get hurt badly.",
    "It has grown after last week's rain. Filled with water so depth is not visible. School children cross here daily.",
    "Multiple potholes in a 50m stretch. Auto rickshaws and bikes are the worst affected.",
  ],
  ROAD_DAMAGE: [
    "Footpath tiles are broken and raised — tripping hazard for senior citizens.",
    "Surface has crumbled to gravel; extremely slippery for two-wheelers.",
  ],
  FLOODING: [
    "After 30 minutes of rain the entire stretch floods knee-deep. Shops get water inside.",
    "Storm water does not drain for 2–3 days. Vehicles stalling in the middle of the road.",
  ],
  DRAINAGE: [
    "The drain is completely blocked with plastic and silt. Overflowing onto the road.",
    "Open drain cover missing — dangerous, especially at night.",
  ],
  GARBAGE: [
    "Garbage has not been collected for 4 days. Strays are scattering it across the street.",
    "Someone keeps dumping construction debris and household waste at the corner.",
  ],
  STREETLIGHT: [
    "Complete dark stretch after 7 PM. Women avoid this road at night.",
    "Pole lights flicker and die. Complaint made before on the helpline, no action.",
  ],
  WATER_LEAK: [
    "Pipe has been leaking for a week — thousands of litres wasted daily.",
    "Water is coming up through the road surface, making it muddy and slippery.",
  ],
  TRAFFIC_SIGNAGE: [
    "The signal has been dead for 3 days causing massive jams during office hours.",
    "Signboard fell after wind; lying on the footpath, edges are sharp.",
  ],
  INFRASTRUCTURE: [
    "Park bench broken with exposed nails. Kids play around it.",
    "Fence around the garden damaged; stray cattle entering and destroying plants.",
  ],
  OTHER: [
    "Issue affecting the whole lane; requesting inspection by concerned department.",
    "Not sure which department handles this — please route appropriately.",
  ],
};

const RISK_REASONS = [
  "High submission frequency from this account",
  "Similar text reused across previous reports",
  "Photo does not fully match the description",
  "New account with burst activity",
  "GPS moved significantly between photo capture and submission",
  "Multiple reports from the same device",
];

const AI_SUMMARIES = [
  "{c} detected near {a}. {sev} severity with {saf} for commuters and residents.",
  "Image and text analysis indicates {c} at {a}. {sev} severity; {saf}.",
];

// ── Case generation ──────────────────────────────────────────

const CAT_WEIGHTS: { v: Category; w: number }[] = [
  { v: "POTHOLE", w: 18 },
  { v: "GARBAGE", w: 15 },
  { v: "STREETLIGHT", w: 14 },
  { v: "WATER_LEAK", w: 11 },
  { v: "FLOODING", w: 11 },
  { v: "DRAINAGE", w: 9 },
  { v: "ROAD_DAMAGE", w: 8 },
  { v: "INFRASTRUCTURE", w: 5 },
  { v: "TRAFFIC_SIGNAGE", w: 5 },
  { v: "OTHER", w: 4 },
];

function statusForAge(ageDays: number, isCritical: boolean): CaseStatus {
  if (ageDays < 1) return pickW([{ v: "REPORTED" as CaseStatus, w: 3 }, { v: "ANALYZING" as CaseStatus, w: 5 }, { v: "ASSIGNED" as CaseStatus, w: 4 }, { v: "IN_PROGRESS" as CaseStatus, w: 2 }]);
  if (ageDays < 4) return pickW([{ v: "ANALYZING" as CaseStatus, w: 2 }, { v: "ASSIGNED" as CaseStatus, w: 4 }, { v: "IN_PROGRESS" as CaseStatus, w: 5 }, { v: "RESOLVED" as CaseStatus, w: isCritical ? 3 : 1 }]);
  if (ageDays < 12) return pickW([{ v: "ASSIGNED" as CaseStatus, w: 2 }, { v: "IN_PROGRESS" as CaseStatus, w: 5 }, { v: "RESOLVED" as CaseStatus, w: 3 }, { v: "VERIFICATION" as CaseStatus, w: 2 }, { v: "CLOSED" as CaseStatus, w: 2 }, { v: "REOPENED" as CaseStatus, w: 1 }]);
  if (ageDays < 40) return pickW([{ v: "IN_PROGRESS" as CaseStatus, w: 3 }, { v: "RESOLVED" as CaseStatus, w: 2 }, { v: "VERIFICATION" as CaseStatus, w: 2 }, { v: "CLOSED" as CaseStatus, w: 6 }, { v: "REJECTED" as CaseStatus, w: 1 }, { v: "REOPENED" as CaseStatus, w: 1 }]);
  return pickW([{ v: "CLOSED" as CaseStatus, w: 9 }, { v: "REJECTED" as CaseStatus, w: 1 }, { v: "REOPENED" as CaseStatus, w: 1 }]);
}

function buildHistory(
  status: CaseStatus,
  createdAt: number,
  reporter: Citizen,
  adminName: string,
  workerName: string | null,
  resolvedAt: number | null,
  closedAt: number | null
): StatusEvent[] {
  const ev: StatusEvent[] = [
    { status: "REPORTED", at: iso(createdAt), byName: reporter.name, byRole: "CITIZEN" },
    { status: "ANALYZING", at: iso(createdAt + 2 * 60000), byName: "Fixwise AI", byRole: "SYSTEM" },
  ];
  const reached = (s: CaseStatus) => {
    const order: CaseStatus[] = ["REPORTED", "ANALYZING", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "VERIFICATION", "CLOSED"];
    return order.indexOf(s) <= order.indexOf(status) || status === "REJECTED" || status === "REOPENED";
  };
  const index: Partial<Record<CaseStatus, number>> = {
    REPORTED: 0,
    ANALYZING: 1,
    ASSIGNED: 2,
    IN_PROGRESS: 3,
    RESOLVED: 4,
    VERIFICATION: 5,
    CLOSED: 6,
  };
  const cur = index[status] ?? 5;
  if (cur >= 2)
    ev.push({
      status: "ASSIGNED",
      at: iso(createdAt + ri(5, 90) * 60000),
      byName: "Auto-routing",
      byRole: "SYSTEM",
      note: "Municipality & department determined from GPS",
    });
  if (cur >= 3)
    ev.push({
      status: "IN_PROGRESS",
      at: iso(createdAt + ri(2, 30) * HOUR),
      byName: adminName,
      byRole: "MUNICIPALITY_ADMIN",
      note: workerName ? `Assigned to ${workerName}` : undefined,
    });
  if (cur >= 4 && resolvedAt)
    ev.push({
      status: "RESOLVED",
      at: iso(resolvedAt),
      byName: workerName ?? adminName,
      byRole: "MUNICIPALITY_ADMIN",
      note: "Completion evidence attached",
    });
  if (status === "REJECTED") {
    if (resolvedAt) ev.push({ status: "RESOLVED", at: iso(resolvedAt), byName: workerName ?? adminName, byRole: "MUNICIPALITY_ADMIN" });
    ev.push({ status: "VERIFICATION", at: iso((resolvedAt ?? createdAt + 30 * HOUR) + 2 * HOUR), byName: adminName, byRole: "MUNICIPALITY_ADMIN" });
    ev.push({ status: "REJECTED", at: iso((resolvedAt ?? createdAt + 32 * HOUR) + ri(3, 18) * HOUR), byName: adminName, byRole: "MUNICIPALITY_ADMIN", note: "Verification failed — evidence insufficient" });
    return ev;
  }
  if (status === "REOPENED") {
    if (resolvedAt) ev.push({ status: "RESOLVED", at: iso(resolvedAt), byName: workerName ?? adminName, byRole: "MUNICIPALITY_ADMIN" });
    ev.push({ status: "VERIFICATION", at: iso((resolvedAt ?? createdAt + 30 * HOUR) + 2 * HOUR), byName: adminName, byRole: "MUNICIPALITY_ADMIN" });
    ev.push({ status: "REJECTED", at: iso((resolvedAt ?? createdAt + 32 * HOUR) + 5 * HOUR), byName: adminName, byRole: "MUNICIPALITY_ADMIN" });
    ev.push({ status: "REOPENED", at: iso((resolvedAt ?? createdAt + 37 * HOUR) + ri(2, 9) * HOUR), byName: adminName, byRole: "MUNICIPALITY_ADMIN", note: "Reopened for rework" });
    return ev;
  }
  if (cur >= 5 && resolvedAt)
    ev.push({ status: "VERIFICATION", at: iso(resolvedAt + 2 * HOUR), byName: adminName, byRole: "MUNICIPALITY_ADMIN" });
  if (cur >= 6 && closedAt)
    ev.push({ status: "CLOSED", at: iso(closedAt), byName: adminName, byRole: "MUNICIPALITY_ADMIN", note: "Verification passed" });
  return ev;
}

function buildCase(i: number): Case {
  const m = pickW([
    { v: MUNICIPALITIES[0], w: 50 },
    { v: MUNICIPALITIES[1], w: 30 },
    { v: MUNICIPALITIES[2], w: 20 },
  ]);
  const category = pickW(CAT_WEIGHTS);
  const area: Area = pick(m.areas);
  const ageDays = Math.floor(Math.pow(rnd(), 1.35) * 118) + 0.02;
  const createdAt = MOCK_NOW.getTime() - ageDays * DAY - ri(0, 20) * HOUR * 0.5;

  const severity = rf(0.25, 0.97);
  const safetyRisk = clamp01(severity * rf(0.6, 1.15));
  const confidence = rf(0.62, 0.98);

  const mine = i % 9 === 2; // ~8 cases belong to the demo citizen
  const reporter = mine ? CITIZENS[0] : pick(CITIZENS.slice(1));
  const nReports = pickW([
    { v: 1, w: 55 },
    { v: 2, w: 20 },
    { v: 3, w: 12 },
    { v: 4, w: 8 },
    { v: 5, w: 5 },
  ]);
  const others = CITIZENS.filter((c) => c.id !== reporter.id);
  const linked: LinkedReport[] = [];
  for (let r = 0; r < nReports; r++) {
    const citizen = r === 0 ? reporter : others[(i * 7 + r * 3) % others.length];
    const riskScore = pickW([
      { v: ri(2, 30), w: 80 },
      { v: ri(35, 60), w: 15 },
      { v: ri(62, 90), w: 5 },
    ]);
    linked.push({
      id: `r-${1001 + i}-${r + 1}`,
      citizenId: citizen.id,
      citizenName: citizen.name,
      description: BODIES[category][r % BODIES[category].length],
      createdAt: iso(createdAt + r * ri(3, 40) * HOUR),
      hasPhoto: rnd() > 0.15,
      riskScore,
      riskLevel: riskLevelFromScore(riskScore),
    });
  }

  const riskScore = linked[0].riskScore;
  const riskLevel = riskLevelFromScore(riskScore);
  const risk: RiskAssessment = {
    score: riskScore,
    level: riskLevel,
    action: riskActionFromLevel(riskLevel),
    reasons: riskScore >= 35 ? [pick(RISK_REASONS), pick(RISK_REASONS)].filter((v, idx, a) => a.indexOf(v) === idx) : [],
  };

  const publicImpact = Math.min(10, Math.round((nReports - 1) * 2 + severity * 5 + ri(0, 2)));
  const ps: PriorityScore = computePriorityScore({
    severity,
    safetyRisk,
    linkedReports: nReports,
    locationImportance: area.imp,
    ageDays,
    publicImpact,
  });
  const priority = priorityFromScore(ps.total);
  const status = statusForAge(ageDays, priority === "CRITICAL");

  const deptKey = DEPT_FOR_CATEGORY[category];
  const adminName = MUNI_ADMIN_NAMES[m.id];
  const deptWorkers = WORKERS.filter((w) => w.municipalityId === m.id && w.departmentKey === deptKey && w.active);
  const worker = deptWorkers.length ? deptWorkers[i % deptWorkers.length] : null;

  const slaHours = PRIORITY_SLA_HOURS[priority];
  const dueAt = createdAt + slaHours * HOUR;
  let resolvedAt: number | null = null;
  let closedAt: number | null = null;
  const done = ["RESOLVED", "VERIFICATION", "CLOSED", "REJECTED", "REOPENED"].includes(status);
  if (done) {
    resolvedAt = createdAt + slaHours * rf(0.35, 1.45) * HOUR;
    if (status === "CLOSED") closedAt = resolvedAt + ri(4, 30) * HOUR;
  }
  const breached = resolvedAt ? resolvedAt > dueAt : MOCK_NOW.getTime() > dueAt;
  const slaStatus: SLAStatus = done
    ? breached ? "BREACHED" : "MET"
    : MOCK_NOW.getTime() > dueAt
      ? "BREACHED"
      : dueAt - MOCK_NOW.getTime() < slaHours * 0.25 * HOUR
        ? "AT_RISK"
        : "ON_TRACK";
  const sla: SLARecord = {
    createdAt: iso(createdAt),
    dueAt: iso(dueAt),
    hoursAllowed: slaHours,
    breached: breached && status !== "CLOSED" ? breached : breached,
    status: slaStatus,
    resolvedAt: resolvedAt ? iso(resolvedAt) : null,
  };

  const history = buildHistory(status, createdAt, reporter, adminName, worker?.name ?? null, resolvedAt, closedAt);

  const evidence: EvidenceItem[] = [];
  if (done) {
    evidence.push({
      id: `e-${1001 + i}-1`,
      type: "BEFORE",
      note: "Condition at the time of assignment",
      at: iso(createdAt + 3 * HOUR),
      byName: worker?.name ?? adminName,
    });
    evidence.push({
      id: `e-${1001 + i}-2`,
      type: "AFTER",
      note: pick(["Repaired and levelled", "Debris cleared, site washed", "New unit installed and tested", "Drain desilted, water flowing", "Patched and compacted"]),
      at: iso((resolvedAt as number) - ri(0, 2) * HOUR),
      byName: worker?.name ?? adminName,
    });
  }

  let verification: Verification | null = null;
  if (status === "VERIFICATION")
    verification = { status: "PENDING", method: "PHOTO", byName: null, at: null, notes: "" };
  if (status === "CLOSED")
    verification = { status: "PASSED", method: "PHOTO", byName: adminName, at: iso(closedAt ?? resolvedAt ?? createdAt), notes: "Evidence reviewed — work verified on record" };
  if (status === "REJECTED" || status === "REOPENED")
    verification = { status: "FAILED", method: "INSPECTION", byName: adminName, at: iso(resolvedAt ?? createdAt), notes: "Site visit found incomplete work" };

  const feedback = status === "CLOSED" && rnd() > 0.3
    ? {
        rating: ri(3, 5),
        resolvedConfirmed: rnd() > 0.1,
        comment: pick(["Fixed within a day, thank you!", "Good work but took a while.", "Properly repaired.", "Quick response by the team.", ""]),
        at: iso((closedAt ?? createdAt) + ri(5, 40) * HOUR),
      }
    : null;

  const catMeta = CATEGORY_MAP[category];
  const ai: AIAnalysis = {
    category,
    severity,
    safetyRisk,
    confidence,
    recommendedDepartment: catMeta.dept,
    summary: pick(AI_SUMMARIES)
      .replace("{c}", catMeta.label.toLowerCase())
      .replace("{a}", area.name)
      .replace("{sev}", severity > 0.7 ? "High" : severity > 0.4 ? "Moderate" : "Low")
      .replace("{saf}", safetyRisk > 0.6 ? "significant safety risk" : "limited immediate safety risk"),
    model: "gemma-2 / gemini-flash (mock)",
    analyzedAt: iso(createdAt + 2 * 60000),
    duplicateOfCaseId: null,
    duplicateProbability: nReports > 1 ? 0.9 : rf(0.05, 0.4),
  };

  const title = pick(TITLES[category]).replace("{a}", area.name);
  const jitter = () => rf(-0.004, 0.004);

  return {
    id: `c-${1001 + i}`,
    caseNumber: 1001 + i,
    title,
    description: BODIES[category][0],
    category,
    status,
    priority,
    priorityScore: ps,
    municipalityId: m.id,
    departmentKey: deptKey,
    location: { lat: area.lat + jitter(), lng: area.lng + jitter(), label: area.name },
    reporter,
    linkedReports: linked,
    ai,
    risk,
    sla,
    statusHistory: history,
    assignment: ["ASSIGNED", "IN_PROGRESS", "RESOLVED", "VERIFICATION", "CLOSED", "REOPENED"].includes(status) && worker
      ? { workerId: worker.id, workerName: worker.name, assignedAt: iso(createdAt + ri(1, 20) * HOUR), assignedBy: adminName }
      : null,
    evidence,
    verification,
    feedback,
    createdAt: iso(createdAt),
    updatedAt: history[history.length - 1].at,
  };
}

export const CASES: Case[] = Array.from({ length: 72 }, (_, i) => buildCase(i));

// ── Recurring problems ───────────────────────────────────────

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const RECURRING_PROBLEMS: RecurringProblem[] = [
  {
    id: "rp-1",
    municipalityId: "m-pmc",
    category: "FLOODING",
    locationLabel: "Kharadi – Wagholi Road stretch",
    center: { lat: 18.5512, lng: 73.946 },
    months: MONTH_LABELS.map((month, idx) => ({ month, count: [4, 5, 7, 9, 12, 15, 19, 22][idx] })),
    trend: "RISING",
    totalReports: 93,
    firstSeen: "2025-06-11T00:00:00Z",
    lastSeen: "2026-08-29T00:00:00Z",
    rootCause: "Inadequate drainage capacity: the storm-water line pre-dates the IT-park boom and cannot handle current run-off. Every monsoon the same 400m stretch floods within 30 minutes of rain.",
    recommendation: "Inspect and desilt the existing line, then commission a hydraulic study for a capacity upgrade before next monsoon. Interim: deploy a mobile pump at this location during rain alerts.",
    confidence: 0.87,
    status: "ACTIVE",
  },
  {
    id: "rp-2",
    municipalityId: "m-pmc",
    category: "POTHOLE",
    locationLabel: "Baner Road service lane",
    center: { lat: 18.559, lng: 73.7756 },
    months: MONTH_LABELS.map((month, idx) => ({ month, count: [6, 4, 5, 8, 7, 9, 13, 11][idx] })),
    trend: "RISING",
    totalReports: 63,
    firstSeen: "2025-01-08T00:00:00Z",
    lastSeen: "2026-08-27T00:00:00Z",
    rootCause: "Recurring surface failure: potholes are re-patched superficially instead of cutting and relaying the full lane section. Heavy bus traffic re-opens patches within weeks.",
    recommendation: "Stop spot-patching. Mill and relay the full 300m service lane with a proper bituminous base course; add a 6-month defect liability clause to the contractor's work order.",
    confidence: 0.81,
    status: "UNDER_REVIEW",
  },
  {
    id: "rp-3",
    municipalityId: "m-pcmc",
    category: "GARBAGE",
    locationLabel: "Nigdi sector 16 corner",
    center: { lat: 18.6512, lng: 73.7716 },
    months: MONTH_LABELS.map((month, idx) => ({ month, count: [9, 8, 10, 7, 11, 8, 10, 12][idx] })),
    trend: "STABLE",
    totalReports: 75,
    firstSeen: "2025-01-20T00:00:00Z",
    lastSeen: "2026-08-30T00:00:00Z",
    rootCause: "Collection route gap: the morning van skips this corner twice a week, so waste accumulates and attracts secondary dumping by commercial units.",
    recommendation: "Adjust the collection route to cover this corner daily for 8 weeks, place a covered community bin, and enforce spot fines for commercial dumping using photo evidence from this platform.",
    confidence: 0.78,
    status: "ACTIVE",
  },
  {
    id: "rp-4",
    municipalityId: "m-nmc",
    category: "STREETLIGHT",
    locationLabel: "Indira Nagar lanes 3–7",
    center: { lat: 19.995, lng: 73.8035 },
    months: MONTH_LABELS.map((month, idx) => ({ month, count: [5, 6, 4, 6, 7, 5, 8, 7][idx] })),
    trend: "STABLE",
    totalReports: 48,
    firstSeen: "2025-02-02T00:00:00Z",
    lastSeen: "2026-08-25T00:00:00Z",
    rootCause: "Ageing underground cabling: individual poles are repaired but the feeder cable insulation has degraded, causing repeated failures on the same loop.",
    recommendation: "Replace the feeder cable for lanes 3–7 in one project instead of per-pole repairs; consider LED conversion to cut load by 40%.",
    confidence: 0.74,
    status: "ACTIVE",
  },
  {
    id: "rp-5",
    municipalityId: "m-pmc",
    category: "WATER_LEAK",
    locationLabel: "Kothrud – Karve Road junction",
    center: { lat: 18.5074, lng: 73.8077 },
    months: MONTH_LABELS.map((month, idx) => ({ month, count: [3, 3, 4, 2, 5, 6, 7, 6][idx] })),
    trend: "RISING",
    totalReports: 36,
    firstSeen: "2025-05-14T00:00:00Z",
    lastSeen: "2026-08-31T00:00:00Z",
    rootCause: "Pressure fluctuation joint failures: the junction sits at a pressure-zone boundary; old CI pipes with rigid joints leak after every surge.",
    recommendation: "Install a pressure-reducing valve at the zone boundary and replace the 80m CI stretch with MDPE in the next maintenance shutdown.",
    confidence: 0.69,
    status: "UNDER_REVIEW",
  },
  {
    id: "rp-6",
    municipalityId: "m-pcmc",
    category: "DRAINAGE",
    locationLabel: "Bhosari MIDC approach",
    center: { lat: 18.6331, lng: 73.7634 },
    months: MONTH_LABELS.map((month, idx) => ({ month, count: [7, 6, 8, 9, 8, 10, 9, 8][idx] })),
    trend: "FALLING",
    totalReports: 65,
    firstSeen: "2025-01-05T00:00:00Z",
    lastSeen: "2026-08-20T00:00:00Z",
    rootCause: "Industrial silt load: MIDC run-off silts the drains faster than the quarterly desilt cycle.",
    recommendation: "Move this stretch to a monthly desilt cycle during monsoon and coordinate with MIDC on pre-treatment of run-off. Trend improving since June — continue current plan.",
    confidence: 0.72,
    status: "MITIGATED",
  },
];

// ── AI insights ──────────────────────────────────────────────

export const AI_INSIGHTS: AIInsight[] = [
  {
    id: "ai-1",
    type: "SPIKE",
    title: "Flooding reports up 140% in PMC",
    body: "38 flooding reports in the last 14 days vs a 16-report baseline, clustered around Kharadi and Hadapsar. Consistent with the current monsoon spell and the known Kharadi capacity issue.",
    municipalityId: "m-pmc",
    at: iso(MOCK_NOW.getTime() - 3 * HOUR),
    confidence: 0.91,
  },
  {
    id: "ai-2",
    type: "DUPLICATE_CLUSTER",
    title: "5 duplicate reports merged into one case",
    body: "Five citizens reported the same waterlogged underpass from different angles. Merged into a single case — linked reports raised priority from MEDIUM to HIGH.",
    municipalityId: "m-pcmc",
    at: iso(MOCK_NOW.getTime() - 9 * HOUR),
    confidence: 0.88,
  },
  {
    id: "ai-3",
    type: "RISK_ANOMALY",
    title: "Suspicious submission pattern flagged for review",
    body: "One account filed 11 reports in 48 hours with recycled text. Risk score 82 — queued for manual review, not auto-rejected. 3 of 11 verified genuine so far.",
    municipalityId: "m-pmc",
    at: iso(MOCK_NOW.getTime() - 26 * HOUR),
    confidence: 0.83,
  },
  {
    id: "ai-4",
    type: "SLA_WARNING",
    title: "CRITICAL SLA breaches concentrated on Sunday nights",
    body: "6 of this month's 9 CRITICAL breaches started between 8 PM Sunday and 6 AM Monday, when only the skeleton crew is on. Consider an on-call rota change.",
    municipalityId: "m-pmc",
    at: iso(MOCK_NOW.getTime() - 2 * DAY),
    confidence: 0.76,
  },
  {
    id: "ai-5",
    type: "RECOMMENDATION",
    title: "Bulk relaying beats patching on Baner Road",
    body: "The service lane consumed 14 patch work-orders in 8 months (₹2.1L). A single mill-and-relay work order is estimated at ₹3.4L with a 6-month warranty. Recommendation sent to Roads.",
    municipalityId: "m-pmc",
    at: iso(MOCK_NOW.getTime() - 3 * DAY),
    confidence: 0.81,
  },
  {
    id: "ai-6",
    type: "HOTSPOT_ALERT",
    title: "New garbage hotspot forming in Wakad",
    body: "Reports from the Wakad–Hinjewadi bridge corner tripled month-over-month. Not yet a recurring problem by definition (needs 3 months) — watchlist added.",
    municipalityId: "m-pcmc",
    at: iso(MOCK_NOW.getTime() - 4 * DAY),
    confidence: 0.64,
  },
  {
    id: "ai-7",
    type: "SPIKE",
    title: "Nashik streetlight failures following cable fault",
    body: "12 streetlight reports in Indira Nagar within 5 days — pattern matches a single feeder fault, not individual pole failures. One work order could clear all 12.",
    municipalityId: "m-nmc",
    at: iso(MOCK_NOW.getTime() - 5 * DAY),
    confidence: 0.86,
  },
  {
    id: "ai-8",
    type: "RECOMMENDATION",
    title: "Pre-monsoon desilt scheduling optimization",
    body: "Historical analysis suggests starting desilt in Bhosari MIDC by 15 April (not mid-May) would have avoided an estimated 80% of last season's overflow reports.",
    municipalityId: null,
    at: iso(MOCK_NOW.getTime() - 8 * DAY),
    confidence: 0.71,
  },
];

// ── Notifications ────────────────────────────────────────────

const myCase = CASES.find((c) => c.reporter.id === "u-me");
export const NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    audience: "citizen",
    title: myCase ? `Case #${myCase.caseNumber} update` : "Case update",
    body: myCase ? `Your report "${myCase.title}" moved to ${myCase.status.replaceAll("_", " ")}.` : "Your report moved forward.",
    at: iso(MOCK_NOW.getTime() - 2 * HOUR),
    read: false,
    caseId: myCase?.id,
  },
  {
    id: "n-2",
    audience: "citizen",
    title: "Report received",
    body: "Thanks for reporting. AI classified it and routed it to your municipality within a minute.",
    at: iso(MOCK_NOW.getTime() - 2 * DAY),
    read: true,
    caseId: myCase?.id,
  },
  {
    id: "n-3",
    audience: "muni-admin",
    title: "New CRITICAL case",
    body: "Flooding near Kharadi flagged CRITICAL (score 86). SLA: 4 hours.",
    at: iso(MOCK_NOW.getTime() - 50 * 60000),
    read: false,
    caseId: CASES.find((c) => c.priority === "CRITICAL")?.id,
  },
  {
    id: "n-4",
    audience: "muni-admin",
    title: "2 SLA breaches this week",
    body: "Both in the Roads department. Review the SLA monitor.",
    at: iso(MOCK_NOW.getTime() - 20 * HOUR),
    read: false,
  },
  {
    id: "n-5",
    audience: "super",
    title: "Weekly digest ready",
    body: "Platform-wide: 1,240 reports, 87% SLA compliance, 2 new recurring problems detected.",
    at: iso(MOCK_NOW.getTime() - 30 * HOUR),
    read: false,
  },
  {
    id: "n-6",
    audience: "super",
    title: "Municipality comparison updated",
    body: "PMC leads on resolution rate; PCMC improved SLA compliance by 6 points.",
    at: iso(MOCK_NOW.getTime() - 3 * DAY),
    read: true,
  },
];

// ── Audit logs (sample) ──────────────────────────────────────

export const AUDIT_LOGS: AuditLog[] = [
  { id: "a-1", at: iso(MOCK_NOW.getTime() - 1 * HOUR), actor: "Rahul Kulkarni", action: "STATUS_CHANGE", detail: "Case #1014 → IN_PROGRESS" },
  { id: "a-2", at: iso(MOCK_NOW.getTime() - 4 * HOUR), actor: "Vikas Jadhav", action: "VERIFICATION", detail: "Case #1031 verification PASSED" },
  { id: "a-3", at: iso(MOCK_NOW.getTime() - 8 * HOUR), actor: "Rahul Kulkarni", action: "ASSIGNMENT", detail: "Case #1005 assigned to Ravi Shinde" },
  { id: "a-4", at: iso(MOCK_NOW.getTime() - 2 * DAY), actor: "Meera Deshpande", action: "USER_MANAGEMENT", detail: "Created department admin account (PCMC/Sanitation)" },
];

// ── Mock AI helpers (stand-in for Member 3's service) ────────

const KEYWORDS: { re: RegExp; cat: Category }[] = [
  { re: /pothole|pot hole|gaddha|crater|hole in the road/i, cat: "POTHOLE" },
  { re: /flood|waterlog|water logging|submerge|knee.deep/i, cat: "FLOODING" },
  { re: /garbage|kachra|trash|waste|dump|debris|stink/i, cat: "GARBAGE" },
  { re: /streetlight|street light|lamp|bulb|dark street|pole light/i, cat: "STREETLIGHT" },
  { re: /leak|pipe|pipeline|tap|water wast|seep/i, cat: "WATER_LEAK" },
  { re: /drain|gutter|sewage|nala|nullah|manhole/i, cat: "DRAINAGE" },
  { re: /footpath|crack|road damag|surface|speed.?break|broken road/i, cat: "ROAD_DAMAGE" },
  { re: /signal|signage|sign ?board|traffic light|zebra|miss(ing)? sign/i, cat: "TRAFFIC_SIGNAGE" },
  { re: /park|bench|fence|playground|garden|tree branch/i, cat: "INFRASTRUCTURE" },
];

export function suggestCategory(text: string): Category | null {
  for (const k of KEYWORDS) if (k.re.test(text)) return k.cat;
  return text.trim().length > 30 ? "OTHER" : null;
}

export const TRANSITIONS = ALLOWED_TRANSITIONS;
