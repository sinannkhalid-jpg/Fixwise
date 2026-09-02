"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Form";
import { InfoNote } from "@/components/ui/Misc";
import { ROLE_HOME } from "@/lib/personas";
import { getSupabase } from "@/lib/supabase";
import { useApp } from "@/lib/store";

export default function LoginPage() {
  const { authLoading } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const signIn = async () => {
    const supabase = getSupabase();
    if (!supabase) { setError("Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."); return; }
    setSubmitting(true); setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError(signInError.message); setSubmitting(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const role = profile?.role as keyof typeof ROLE_HOME | undefined;
    if (!role || !ROLE_HOME[role]) {
      await supabase.auth.signOut();
      setError("This account has not been provisioned with a Fixwise role.");
      setSubmitting(false);
      return;
    }
    router.push(ROLE_HOME[role]);
    setSubmitting(false);
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
              void signIn();
            }}
          >
            <Field label="Email" required>
              <Input type="email" required placeholder="you@example.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" required>
              <Input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting || authLoading}>
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
          Your permissions are assigned to your account by the platform. Staff accounts cannot choose a role during sign-in.
        </InfoNote>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="font-semibold text-slate-900">Secure role-based access</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Your account type determines which dashboard and permissions you receive.</p>
      </div>
    </div>
  );
}
