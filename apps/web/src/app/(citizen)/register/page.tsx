"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Form";
import { InfoNote } from "@/components/ui/Misc";
import { useApp } from "@/lib/store";

export default function RegisterPage() {
  const { setPersona } = useApp();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

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
            // Mock: sign in as the demo citizen persona
            setPersona({ id: "citizen", name: form.name || "Ananya Sharma", email: form.email || "ananya@example.in", role: "CITIZEN", userId: "u-me", label: "Citizen" });
            router.push("/report");
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
          <Button type="submit" className="w-full">
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

      <div className="mt-4">
        <InfoNote tone="amber">
          <strong>Demo mode:</strong> registration is mocked and signs you in as the demo citizen. Supabase Auth +
          RLS arrive with the backend.
        </InfoNote>
      </div>
    </div>
  );
}
