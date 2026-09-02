// ── Domain types ─────────────────────────────────────────────
// Source of truth until Member 1's schema lands (see docs/api-contract.md).
// Field names intentionally match the planned REST payloads.

export type Role =
  | "CITIZEN"
  | "MUNICIPALITY_ADMIN"
  | "DEPARTMENT_ADMIN"
  | "SUPER_ADMIN";

export type CaseStatus =
  | "REPORTED"
  | "ANALYZING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "VERIFICATION"
  | "CLOSED"
  | "REJECTED"
  | "REOPENED";

export type Priority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type RiskAction = "NORMAL" | "ADDITIONAL_VERIFICATION" | "MANUAL_REVIEW" | "HOLD";

export type Category =
  | "POTHOLE"
  | "FLOODING"
  | "GARBAGE"
  | "STREETLIGHT"
  | "WATER_LEAK"
  | "DRAINAGE"
  | "ROAD_DAMAGE"
  | "INFRASTRUCTURE"
  | "TRAFFIC_SIGNAGE"
  | "OTHER";

export type DepartmentKey =
  | "roads"
  | "water"
  | "electrical"
  | "sanitation"
  | "drainage"
  | "traffic"
  | "infrastructure";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Municipality {
  id: string;
  name: string;
  shortName: string;
  center: GeoPoint;
  areas: Area[];
}

export interface Area {
  name: string;
  lat: number;
  lng: number;
  /** location importance 0–10 for the priority engine */
  imp: number;
}

export interface Department {
  id: string;
  municipalityId: string;
  key: DepartmentKey;
  name: string;
  head: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  departmentKey: DepartmentKey;
  municipalityId: string;
  active: boolean;
}

export interface Citizen {
  id: string;
  name: string;
}

export interface LinkedReport {
  id: string;
  citizenId: string;
  citizenName: string;
  description: string;
  createdAt: string; // ISO
  hasPhoto: boolean;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface AIAnalysis {
  category: Category;
  severity: number; // 0–1
  safetyRisk: number; // 0–1
  confidence: number; // 0–1
  recommendedDepartment: DepartmentKey;
  summary: string;
  model: string;
  analyzedAt: string;
  duplicateOfCaseId: string | null;
  duplicateProbability: number;
}

export interface PriorityScore {
  severity: number; // 0–30
  safetyRisk: number; // 0–20
  reportCount: number; // 0–20
  locationImportance: number; // 0–10
  complaintAge: number; // 0–10
  publicImpact: number; // 0–10
  total: number; // 0–100
}

export interface RiskAssessment {
  score: number; // 0–100
  level: RiskLevel;
  action: RiskAction;
  reasons: string[];
}

export type SLAStatus = "ON_TRACK" | "AT_RISK" | "BREACHED" | "MET";

export interface SLARecord {
  createdAt: string;
  dueAt: string;
  hoursAllowed: number;
  breached: boolean;
  status: SLAStatus;
  resolvedAt: string | null;
}

export interface StatusEvent {
  status: CaseStatus;
  at: string;
  byName: string;
  byRole: string;
  note?: string;
}

export interface Assignment {
  workerId: string;
  workerName: string;
  assignedAt: string;
  assignedBy: string;
}

export interface EvidenceItem {
  id: string;
  type: "BEFORE" | "AFTER" | "NOTE";
  note: string;
  at: string;
  byName: string;
  photoDataUrl?: string;
}

export interface Verification {
  status: "PENDING" | "PASSED" | "FAILED";
  method: "PHOTO" | "INSPECTION" | "CITIZEN_CONFIRM";
  byName: string | null;
  at: string | null;
  notes: string;
}

export interface Feedback {
  rating: number; // 1–5
  resolvedConfirmed: boolean;
  comment: string;
  at: string;
}

export interface Case {
  id: string; // c-1024
  caseNumber: number; // 1024
  title: string;
  description: string;
  category: Category;
  status: CaseStatus;
  priority: Priority;
  priorityScore: PriorityScore;
  municipalityId: string;
  departmentKey: DepartmentKey | null;
  location: GeoPoint & { label: string };
  reporter: Citizen;
  linkedReports: LinkedReport[];
  ai: AIAnalysis;
  risk: RiskAssessment;
  sla: SLARecord;
  statusHistory: StatusEvent[];
  assignment: Assignment | null;
  evidence: EvidenceItem[];
  verification: Verification | null;
  feedback: Feedback | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  audience: "citizen" | "muni-admin" | "super";
  title: string;
  body: string;
  at: string;
  read: boolean;
  caseId?: string;
}

export type RecurringStatus = "ACTIVE" | "UNDER_REVIEW" | "MITIGATED";

export interface RecurringProblem {
  id: string;
  municipalityId: string;
  category: Category;
  locationLabel: string;
  center: GeoPoint;
  months: { month: string; count: number }[];
  trend: "RISING" | "STABLE" | "FALLING";
  totalReports: number;
  firstSeen: string;
  lastSeen: string;
  rootCause: string;
  recommendation: string;
  confidence: number;
  status: RecurringStatus;
}

export interface Hotspot {
  id: string;
  municipalityId: string;
  category: Category;
  center: GeoPoint;
  radiusKm: number;
  caseCount: number;
  intensity: number; // 0–1
  label: string;
}

export type InsightType =
  | "SPIKE"
  | "DUPLICATE_CLUSTER"
  | "RISK_ANOMALY"
  | "SLA_WARNING"
  | "RECOMMENDATION"
  | "HOTSPOT_ALERT";

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  body: string;
  municipalityId: string | null;
  caseId?: string;
  at: string;
  confidence: number;
}

export interface AuditLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

export interface Persona {
  id: string;
  name: string;
  email: string;
  role: Role;
  userId: string;
  municipalityId?: string;
  departmentKey?: DepartmentKey;
  label: string;
}

export interface ReportDraft {
  description: string;
  category: Category | null;
  photos: string[]; // data URLs (mock) / storage paths (real)
  location: GeoPoint & { label: string };
}
