"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Form";
import { InfoNote } from "@/components/ui/Misc";
import { PERSONAS, ROLE_HOME } from "@/lib/personas";
import { useApp } from "@/lib/store";

export default function LoginPage() {
  const { setPersona } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = (id: string) => {
    const p = PERSONAS.find((x) => x.id === id);
    if (!p) return;
    setPersona(p);
    router.push(ROLE_HOME[p.role]);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to track reports and receive updates. Municipal staff sign in with their government accounts.
        </p>

        <Card className="mt-6 p-6">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email.includes("admin") && email.includes("super") ? "super-admin" : email.includes("admin") ? "muni-admin" : "citizen");
            }}
          >
            <Field label="Email" required>
              <Input type="email" required placeholder="you@example.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" required>
              <Input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Button type="submit" className="w-full">
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">
            New citizen?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Create an account
            </Link>
          </p>
        </Card>

        <InfoNote tone="amber">
          <strong>Demo mode:</strong> authentication is mocked — Supabase Auth lands with the backend (Member 1).
          Use the quick sign-in buttons to enter any role.
        </InfoNote>
      </div>

      <div>
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Info className="h-4 w-4 text-blue-500" /> Quick sign-in (demo personas)
        </p>
        <div className="mt-4 space-y-3">
          {PERSONAS.map((p) => (
            <Card key={p.id} className="flex items-center gap-4 p-4" >
              <button onClick={() => signIn(p.id)} className="flex w-full items-center gap-4 text-left">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-500 text-sm font-bold text-white">
                  {p.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{p.label}</span>
                  <span className="block truncate text-xs text-slate-500">{p.email}</span>
                  <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    {p.role.replaceAll("_", " ")}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
