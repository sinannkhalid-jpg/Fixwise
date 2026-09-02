import { Wrench } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-sm">
        <Wrench className="h-5 w-5" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className={`block text-base font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
          Fixwise
        </span>
        <span className={`block text-[10px] font-medium uppercase tracking-widest ${light ? "text-slate-400" : "text-slate-400"}`}>
          Civic Intelligence
        </span>
      </span>
    </span>
  );
}
