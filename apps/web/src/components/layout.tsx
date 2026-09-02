"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, Home, Menu, Send, ListChecks, User as UserIcon, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useApp } from "@/lib/store";
import { ROLE_HOME } from "@/lib/personas";
import { Badge } from "@/components/ui/Badge";

export function CitizenHeader() {
  const path = usePathname();
  const { persona, notifications } = useApp();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => n.audience === "citizen" && !n.read).length;

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/report", label: "Report issue", icon: Send },
    { href: "/reports", label: "My reports", icon: ListChecks },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((l) => {
            const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <l.icon className="h-4 w-4" aria-hidden />
                {l.label}
              </Link>
            );
          })}
          {persona.role !== "CITIZEN" && (
            <Link
              href={ROLE_HOME[persona.role]}
              className="ml-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/reports"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label={`Notifications (${unread} unread)`}
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
          <Link
            href="/report"
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:block"
          >
            Report an issue
          </Link>
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-slate-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <l.icon className="h-4 w-4" aria-hidden />
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
            AI-powered civic issue reporting. Citizens report, AI understands, municipalities resolve —
            openly and accountably.
          </p>
          <Badge className="mt-3 border-amber-200 bg-amber-50 text-amber-700">MVP demo · mock data</Badge>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Citizens</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link className="hover:text-blue-700" href="/report">Report an issue</Link></li>
            <li><Link className="hover:text-blue-700" href="/reports">Track my reports</Link></li>
            <li><Link className="hover:text-blue-700" href="/profile">Profile</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Government</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link className="hover:text-blue-700" href="/municipality">Municipality dashboard</Link></li>
            <li><Link className="hover:text-blue-700" href="/admin">Main admin dashboard</Link></li>
            <li><Link className="hover:text-blue-700" href="/login">Staff sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        Fixwise · AI-Powered Citizen Complaint Management & Civic Intelligence Platform
      </div>
    </footer>
  );
}
