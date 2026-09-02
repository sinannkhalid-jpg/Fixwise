import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  icon: IconCmp,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <IconCmp className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{body}</p>
    </div>
  );
}

export function ProgressBar({
  value,
  className = "bg-blue-600",
  height = "h-2",
  label,
}: {
  value: number; // 0–1
  className?: string;
  height?: string;
  label?: string;
}) {
  const pctv = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="w-full" role={label ? "img" : undefined} aria-label={label ?? `${pctv}%`}>
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
        <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${pctv}%` }} />
      </div>
    </div>
  );
}

export function InfoNote({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "amber" | "emerald" | "rose" | "violet";
}) {
  const tones: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    violet: "border-violet-200 bg-violet-50 text-violet-900",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${tones[tone]}`}>{children}</div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-14 w-14 text-lg" };
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 font-semibold text-white ${sizes[size]}`}
    >
      {name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </span>
  );
}
