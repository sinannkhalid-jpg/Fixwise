"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Form";
import { getSupabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const register = async () => {
    const supabase = getSupabase();
    if (!supabase) { setError("Authentication is not configured. Set the Supabase public environment variables."); return; }
    setSubmitting(true); setError("");
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, phone: form.phone } },
    });
    if (signUpError) setError(signUpError.message);
    else setNotice("Account created. Check your email to verify your address, then sign in.");
    setSubmitting(false);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create your citizen account</h1>
      <p className="mt-2 text-sm text-slate-500">
        Report issues, track them to resolution, and rate the work. Government staff accounts are created by
        administrators — not here.
      </p>

      <Card className="mt-6 p-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void register();
          }}
        >
          <Field label="Full name" required>
            <Input required placeholder="Ananya Sharma" value={form.name} onChange={set("name")} />
          </Field>
          <Field label="Email" required>
            <Input type="email" required placeholder="you@example.in" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Mobile number" hint="Used for SMS status updates">
            <Input placeholder="+91 98XXXXXXXX" value={form.phone} onChange={set("phone")} />
          </Field>
          <Field label="Password" required hint="Minimum 8 characters">
            <Input type="password" required minLength={8} value={form.password} onChange={set("password")} />
          </Field>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}
          {notice && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{notice}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            Create account <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>

    </div>
  );
}
