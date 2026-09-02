"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { persona, authLoading, isAuthenticated } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const allowed = isAuthenticated && roles.includes(persona.role);

  useEffect(() => {
    if (!authLoading && !allowed) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [allowed, authLoading, pathname, router]);

  if (authLoading) return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Checking your account…</main>;
  if (!allowed) return null;
  return <>{children}</>;
}
