"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { useSession } from "@/components/SessionProvider";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useSession();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Could not sign in.");
      setSession({ email: body.email, isAdmin: body.is_admin }, body.access_token);
      router.push("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-md px-5 py-16">
        <div className="glass rounded-3xl border border-line p-7">
          <div className="flex gap-2 rounded-xl bg-black/20 p-1">
            {(["login", "register"] as const).map((item) => (
              <button key={item} type="button" onClick={() => { setMode(item); setError(""); }} className={`flex-1 rounded-lg px-3 py-2 text-sm capitalize ${mode === item ? "bg-[#292633] text-violet-100" : "text-zinc-500"}`}>{item}</button>
            ))}
          </div>
          <h1 className="mt-6 text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-sm text-zinc-500">Save your generated videos and access them from any session.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-xs text-zinc-400">Email
              <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-[#0d0e13] px-3 text-sm text-zinc-100" />
            </label>
            <label className="block text-xs text-zinc-400">Password
              <input required minLength={8} maxLength={128} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-line bg-[#0d0e13] px-3 text-sm text-zinc-100" />
              {mode === "register" && <span className="mt-1 block text-zinc-600">Use at least 8 characters.</span>}
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-950/40 p-3 text-sm text-red-300">{error}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-violet px-4 py-3 text-sm font-semibold text-[#15111f] disabled:opacity-50">{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
          <p className="mt-5 text-center text-xs text-zinc-600">You can generate videos without signing in. <Link href="/" className="text-violet-200 underline">Back to studio</Link></p>
        </div>
      </section>
    </main>
  );
}
