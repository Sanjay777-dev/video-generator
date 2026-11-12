"use client";

import { useEffect, useRef, useState } from "react";
import { createJob, enhancePrompt, getJob, getMediaUrl } from "@/lib/api";
import type { Job } from "@/lib/types";

const examples = [
  "A tiny astronaut wanders through a field of glowing flowers on Mars",
  "A cinematic aerial shot of a coastal town at golden hour",
  "A curious fox walks through a misty enchanted forest",
];
const styles = ["None", "Cinematic", "Anime", "Realistic", "3D", "Cartoon"];

function OptionSelect({
  label,
  value,
  onChange,
  values,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  values: string[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-xs text-zinc-400">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border border-line bg-[#191b23] px-3 text-sm text-zinc-100"
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Generator() {
  const [prompt, setPrompt] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [duration, setDuration] = useState("5");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("480p");
  const [seed, setSeed] = useState("");
  const [style, setStyle] = useState("None");
  const [image, setImage] = useState<File | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState("");
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
  }, []);

  async function pollJob(jobId: string) {
    try {
      const current = await getJob(jobId);
      setJob(current);
      if (current.status === "queued" || current.status === "processing") {
        pollTimer.current = setTimeout(() => void pollJob(jobId), 1500);
      } else {
        setBusy(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to check generation status.");
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (inputMode === "image" && !image) {
      setError("Choose a starting image for image-to-video generation.");
      return;
    }
    if (shownPrompt.trim().length > 2000) {
      setError("The prompt, including its style preset, must be 2,000 characters or fewer.");
      return;
    }
    setJob(null);
    setBusy(true);
    try {
      const generated = await createJob({
        prompt: shownPrompt.trim(),
        negative_prompt: negativePrompt.trim(),
        duration: Number(duration),
        aspect_ratio: aspectRatio,
        resolution,
        seed: seed.trim() ? Number(seed) : null,
        image,
      });
      setJob(generated);
      void pollJob(generated.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to start generation.");
      setBusy(false);
    }
  }

  const shownPrompt = style === "None" ? prompt : `${prompt}${prompt ? ", " : ""}${style} style`;
  const isPending = busy && job && (job.status === "queued" || job.status === "processing");

  async function improvePrompt() {
    setError("");
    setEnhancing(true);
    try {
      setPrompt(await enhancePrompt(prompt.trim()));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not improve this prompt.");
    } finally {
      setEnhancing(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
      <form onSubmit={submit} className="glass rounded-3xl border border-line p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-2 rounded-xl bg-black/30 p-1 text-xs">
            <button type="button" onClick={() => setInputMode("text")} className={`rounded-lg px-3 py-2 ${inputMode === "text" ? "bg-[#272333] text-violet-200" : "text-zinc-500"}`}>Text to video</button>
            <button type="button" onClick={() => setInputMode("image")} className={`rounded-lg px-3 py-2 ${inputMode === "image" ? "bg-[#272333] text-violet-200" : "text-zinc-500"}`}>Image to video</button>
          </div>
          <span className="text-xs text-zinc-500">Unlimited creations</span>
        </div>
        <label htmlFor="prompt" className="mb-2 block text-sm font-medium text-zinc-200">
          Describe your video
        </label>
        <textarea
          id="prompt"
          required
          minLength={3}
          maxLength={2000}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="A dreamlike scene, a story, a moment..."
          className="min-h-36 w-full resize-y rounded-2xl border border-line bg-[#0d0e13] p-4 text-sm leading-6 text-zinc-100 placeholder:text-zinc-600"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>{prompt.length}/2000 characters</span>
          <button type="button" disabled={enhancing || prompt.trim().length < 3} onClick={() => void improvePrompt()} className="text-violet-200 hover:text-violet-100 disabled:opacity-40">
            {enhancing ? "Improving..." : "✦ Improve prompt"}
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-2 text-xs text-zinc-400 sm:col-span-2">
            Starting image <span className="text-zinc-600">({inputMode === "image" ? "required" : "optional"}, PNG/JPEG/WebP up to 10 MB)</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-line bg-[#191b23] p-2 text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#282531] file:px-3 file:py-2 file:text-xs file:text-zinc-100"
            />
            {image && <span className="truncate text-violet-200">{image.name}</span>}
          </label>
          <label className="flex min-w-0 flex-col gap-2 text-xs text-zinc-400">
            Style
            <select value={style} onChange={(event) => setStyle(event.target.value)} className="h-10 rounded-xl border border-line bg-[#191b23] px-3 text-sm text-zinc-100">
              {styles.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <OptionSelect label="Duration" value={duration} onChange={setDuration} values={["3", "5", "8"]} />
          <OptionSelect label="Aspect ratio" value={aspectRatio} onChange={setAspectRatio} values={["16:9", "9:16", "1:1"]} />
          <OptionSelect label="Resolution" value={resolution} onChange={setResolution} values={["480p", "720p"]} />
          <label className="flex min-w-0 flex-col gap-2 text-xs text-zinc-400">
            Seed <span className="text-zinc-600">(optional)</span>
            <input
              type="number"
              min="0"
              max="2147483647"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              placeholder="Random"
              className="h-10 rounded-xl border border-line bg-[#191b23] px-3 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </label>
        </div>
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-zinc-400">Negative prompt (optional)</summary>
          <textarea
            value={negativePrompt}
            onChange={(event) => setNegativePrompt(event.target.value)}
            maxLength={1000}
            placeholder="Things to avoid in the video..."
            className="mt-3 min-h-20 w-full rounded-xl border border-line bg-[#0d0e13] p-3 text-sm text-zinc-100 placeholder:text-zinc-600"
          />
        </details>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={busy || prompt.trim().length < 3}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet px-5 text-sm font-semibold text-[#15111f] transition hover:bg-[#b0a1ff] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#251d39] border-t-transparent" /> Generating...</> : <><span aria-hidden="true">✦</span> Generate video</>}
        </button>
        <p className="mt-3 text-center text-xs text-zinc-600">Generation can take a few minutes depending on the selected provider.</p>
      </form>

      <section aria-live="polite" className="flex min-h-[430px] flex-col overflow-hidden rounded-3xl border border-line bg-[#101117]">
        {job?.status === "done" && job.video_url ? (
          <>
            <video controls playsInline poster={job.thumbnail_url ? getMediaUrl(job.thumbnail_url) : undefined} className="aspect-video w-full bg-black object-contain">
              <source src={getMediaUrl(job.video_url)} type="video/mp4" />
              Your browser does not support video playback.
            </video>
            <div className="flex flex-1 flex-col p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-300">Video ready</div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-300">{job.prompt}</p>
              <div className="mt-auto flex gap-3 pt-6">
                <a href={getMediaUrl(job.video_url)} download className="flex-1 rounded-xl bg-violet px-4 py-3 text-center text-sm font-semibold text-[#15111f]">Download video</a>
                <button type="button" onClick={() => { setJob(null); setBusy(false); }} className="rounded-xl border border-line px-4 py-3 text-sm text-zinc-200 hover:bg-white/5">Regenerate</button>
              </div>
            </div>
          </>
        ) : isPending ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6 grid h-20 w-20 place-items-center rounded-3xl border border-violet-300/20 bg-violet-400/10">
              <span className="text-3xl text-violet-200">✦</span>
              <span className="absolute inset-0 animate-ping rounded-3xl border border-violet-300/20" />
            </div>
            <h2 className="text-lg font-semibold">{job.status === "queued" ? "Waiting in the queue" : "Creating your video"}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Your generation is running. You can keep this page open while we prepare the result.</p>
            <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-violet transition-all duration-500" style={{ width: `${Math.max(job.progress, 8)}%` }} />
            </div>
            <span className="mt-2 text-xs text-zinc-500">{job.progress}% · {job.status}</span>
          </div>
        ) : job?.status === "failed" ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <span className="text-3xl text-red-300">!</span>
            <h2 className="mt-3 text-lg font-semibold">Generation failed</h2>
            <p className="mt-2 max-w-sm text-sm text-zinc-400">{job.error ?? "The provider could not complete this request."}</p>
            <button type="button" onClick={() => { setJob(null); setBusy(false); }} className="mt-5 rounded-xl border border-line px-4 py-2 text-sm">Try again</button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-white/[0.03] text-2xl text-violet-200">▶</div>
            <h2 className="mt-5 text-lg font-semibold">Your next idea, in motion</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Describe a scene and VidForge will turn it into a video. Try one of these to get started:</p>
            <div className="mt-5 flex flex-col gap-2">
              {examples.map((example) => (
                <button key={example} type="button" onClick={() => setPrompt(example)} className="rounded-xl border border-line px-4 py-3 text-left text-xs leading-5 text-zinc-400 transition hover:border-violet-400/50 hover:text-zinc-200">{example}</button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
