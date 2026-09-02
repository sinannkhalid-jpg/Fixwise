"use client";

import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Map,
  Repeat,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { useApp } from "@/lib/store";
import { MUNI_BY_ID } from "@/lib/mock/data";

const ITEMS: NavItem[] = [
  { href: "/municipality", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/municipality/reports", label: "Reports", icon: FileText },
  { href: "/municipality/cases", label: "Cases", icon: ClipboardList },
  { href: "/municipality/departments", label: "Departments", icon: Building2 },
  { href: "/municipality/workers", label: "Workers", icon: Users },
  { href: "/municipality/sla", label: "SLA monitor", icon: Timer },
  { href: "/municipality/map", label: "Map", icon: Map },
  { href: "/municipality/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/municipality/recurring-problems", label: "Recurring problems", icon: Repeat },
  { href: "/municipality/ai-insights", label: "AI insights", icon: Sparkles },
];

export default function MunicipalityLayout({ children }: { children: React.ReactNode }) {
  const { activeMunicipalityId } = useApp();
  const muni = MUNI_BY_ID[activeMunicipalityId];
  return (
    <DashboardShell
      title={`Municipality Dashboard · ${muni?.shortName ?? ""}`}
      subtitle={muni?.name}
      items={ITEMS}
      muniSwitcher
    >
      {children}
    </DashboardShell>
  );
}
