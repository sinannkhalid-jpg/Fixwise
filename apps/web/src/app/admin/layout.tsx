"use client";

import { BarChart3, LayoutDashboard, Map, Repeat, Building2, FileText } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/reports", label: "All reports", icon: FileText },
  { href: "/admin/municipalities", label: "Municipalities", icon: Building2 },
  { href: "/admin/analytics", label: "Global analytics", icon: BarChart3 },
  { href: "/admin/map", label: "Global map", icon: Map },
  { href: "/admin/recurring-problems", label: "Recurring problems", icon: Repeat },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["SUPER_ADMIN"]}>
      <DashboardShell title="Main Admin · Platform" subtitle="All municipalities, global statistics & AI intelligence" items={ITEMS}>
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
