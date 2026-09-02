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
  const [role, setRole] = useState("citizen");

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
              signIn(role);
            }}
          >
            <Field label="Email" required>
              <Input type="email" required placeholder="you@example.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Account type" required>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
                <option value="citizen">Citizen</option>
                <option value="muni-admin">Municipality administrator</option>
                <option value="dept-admin">Department administrator</option>
                <option value="super-admin">Platform administrator</option>
              </select>
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

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Secure role-based access</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Your account type determines which dashboard and permissions you receive. Demo account shortcuts have been removed.</p>
      </div>
    </div>
  );
}
