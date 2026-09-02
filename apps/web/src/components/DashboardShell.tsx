"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  Menu,
  RefreshCw,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/ui/Misc";
import { ROLE_HOME } from "@/lib/personas";
import { useApp } from "@/lib/store";
import { fmtRelative } from "@/lib/format";
import { MOCK_NOW } from "@/lib/mock/data";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function DashboardShell({
  title,
  subtitle,
  items,
  children,
  muniSwitcher = false,
}: {
  title: string;
  subtitle?: string;
  items: NavItem[];
  children: ReactNode;
  muniSwitcher?: boolean;
}) {
  const path = usePathname();
  const router = useRouter();
  const { persona, signOut, municipalities, activeMunicipalityId, setActiveMunicipalityId } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Dashboard">
      {items.map((item) => {
        const active = item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="h-4.5 w-4.5 h-5 w-5 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-5">
          <Logo light />
        </div>
        {nav}
        <div className="border-t border-slate-800 p-4">
          <p className="text-[11px] leading-relaxed text-slate-500">
            Demo build — pages run on deterministic mock data until the live API lands.
          </p>
        </div>
      </aside>

      {/* mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
              <Logo light />
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">{title}</h1>
            {subtitle && <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>}
          </div>
          {muniSwitcher && (
            <MuniSwitcher
              value={activeMunicipalityId}
              onChange={(id) => {
                setActiveMunicipalityId(id);
                router.push("/municipality");
              }}
            />
          )}
          <NotificationsBell />
          <AccountMenu onSignOut={async () => { await signOut(); router.push("/login"); }} />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl animate-fade-up">{children}</div>
        </main>
      </div>
    </div>
  );
}

function MuniSwitcher({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { municipalities } = useApp();
  const [open, setOpen] = useState(false);
  const cur = municipalities.find((m) => m.id === value) ?? municipalities[0];
  return (
    <div className="relative hidden sm:block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300"
      >
        {cur.shortName}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
          {municipalities.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs ${
                m.id === value ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="font-medium">{m.name}</span>
              {m.id === value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AccountMenu({ onSignOut }: { onSignOut: () => void | Promise<void> }) {
  const { persona } = useApp();
  const [open, setOpen] = useState(false);
  const cur = persona;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 hover:border-slate-300"
        aria-label="Account menu"
      >
        <Avatar name={cur.name} size="sm" />
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-xs font-semibold text-slate-800">{cur.name.split(" ")[0]}</span>
          <span className="block text-[10px] text-slate-400">{cur.role.replaceAll("_", " ")}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
          <div className="px-3 py-3">
            <p className="text-xs font-semibold text-slate-800">{cur.name}</p>
            <p className="truncate text-[10px] text-slate-400">{cur.email}</p>
          </div>
          <button
            type="button"
            onClick={() => { void onSignOut(); setOpen(false); }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function NotificationsBell() {
  const { notifications, persona, markAllRead, markRead } = useApp();
  const [open, setOpen] = useState(false);
  const audience = persona.role === "CITIZEN" ? "citizen" : persona.role === "SUPER_ADMIN" ? "super" : "muni-admin";
  const list = notifications.filter((n) => n.audience === audience);
  const unread = list.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label={`Notifications, ${unread} unread`}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-30 w-80 rounded-xl border border-slate-200 bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <p className="text-xs font-semibold text-slate-800">Notifications</p>
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5 scrollbar-thin">
              {list.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-400">Nothing yet</p>}
              {list.map((n) => (
                <Link
                  key={n.id}
                  href={n.caseId ? `/reports/${n.caseId}` : "/reports"}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                  className={`block rounded-lg px-3 py-2.5 hover:bg-slate-50 ${n.read ? "opacity-60" : ""}`}
                >
                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />}
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{n.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{fmtRelative(n.at, MOCK_NOW)}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export { RefreshCw };
