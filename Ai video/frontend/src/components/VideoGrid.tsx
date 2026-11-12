"use client";

import { useEffect, useState } from "react";
import { deleteJob, getMediaUrl } from "@/lib/api";
import type { Job } from "@/lib/types";

export default function VideoGrid({ load, canDelete = false }: { load: () => Promise<Job[]>; canDelete?: boolean }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      setJobs(await load());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load videos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function remove(job: Job) {
    if (!window.confirm("Delete this creation and its media files?")) return;
    try {
      await deleteJob(job.id);
      setJobs((current) => current.filter((entry) => entry.id !== job.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this creation.");
    }
  }

  if (loading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="aspect-video animate-pulse rounded-2xl bg-white/[0.05]" />)}</div>;
  }
  if (error) return <p role="alert" className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">{error}</p>;
  if (!jobs.length) return <div className="rounded-2xl border border-dashed border-line p-12 text-center text-sm text-zinc-500">No videos here yet. Generate your first creation in the <a className="text-violet-200 underline" href="/">studio</a>.</div>;

  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
      {jobs.map((job) => (
        <article key={job.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-line bg-panel">
          <video controls preload="metadata" poster={job.thumbnail_url ? getMediaUrl(job.thumbnail_url) : undefined} className="aspect-video w-full bg-black object-cover">
            {job.video_url && <source src={getMediaUrl(job.video_url)} type="video/mp4" />}
          </video>
          <div className="p-4">
            <p className="line-clamp-3 text-sm leading-6 text-zinc-300">{job.prompt}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
              <span>{job.duration}s · {job.aspect_ratio} · {job.resolution}</span>
              <span>{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            {canDelete && <button type="button" onClick={() => void remove(job)} className="mt-3 text-xs text-red-300 hover:text-red-200">Delete creation</button>}
          </div>
        </article>
      ))}
    </div>
  );
}
