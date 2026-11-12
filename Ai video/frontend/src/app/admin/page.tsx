"use client";

import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { useSession } from "@/components/SessionProvider";
import { getAdminJobs, getAdminStatus } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function AdminPage() {
  const { session } = useSession();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [status, setStatus] = useState<{ provider: string; gpu: { available: boolean; name: string | null } } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.isAdmin) {
      setLoading(false);
      return;
    }
    Promise.all([getAdminJobs(), getAdminStatus()])
      .then(([allJobs, system]) => { setJobs(allJobs); setStatus(system); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load admin data."))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <main className="min-h-screen">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-200">System overview</p>
        <h1 className="mt-3 text-3xl font-semibold">Admin</h1>
        {loading ? <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white/[0.05]" /> :
          !session?.isAdmin ? <p className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">Administrator access is required. Sign in with an account configured as ADMIN_EMAIL.</p> :
            error ? <p role="alert" className="mt-6 text-sm text-red-300">{error}</p> : (
              <>
                <div className="mt-7 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-line bg-panel p-5"><div className="text-xs text-zinc-500">Configured provider</div><div className="mt-2 text-xl font-semibold">{status?.provider}</div></div>
                  <div className="rounded-2xl border border-line bg-panel p-5"><div className="text-xs text-zinc-500">GPU available</div><div className="mt-2 text-xl font-semibold">{status?.gpu.available ? "Yes" : "No"}</div></div>
                  <div className="rounded-2xl border border-line bg-panel p-5"><div className="text-xs text-zinc-500">GPU device</div><div className="mt-2 text-xl font-semibold">{status?.gpu.name ?? "—"}</div></div>
                </div>
                <h2 className="mb-3 mt-10 text-lg font-semibold">Recent jobs ({jobs.length})</h2>
                <div className="overflow-x-auto rounded-2xl border border-line">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-white/[0.03] text-xs text-zinc-500"><tr><th className="p-3">Job</th><th className="p-3">Prompt</th><th className="p-3">Status</th><th className="p-3">Progress</th><th className="p-3">Created</th></tr></thead>
                    <tbody>{jobs.map((job) => <tr key={job.id} className="border-t border-line"><td className="p-3 font-mono text-xs text-zinc-500">{job.id.slice(0, 8)}</td><td className="max-w-sm truncate p-3">{job.prompt}</td><td className={`p-3 capitalize ${job.status === "failed" ? "text-red-300" : job.status === "done" ? "text-emerald-300" : "text-violet-200"}`}>{job.status}{job.error ? `: ${job.error}` : ""}</td><td className="p-3">{job.progress}%</td><td className="p-3 text-zinc-500">{new Date(job.created_at).toLocaleString()}</td></tr>)}</tbody>
                  </table>
                </div>
              </>
            )}
      </section>
    </main>
  );
}
