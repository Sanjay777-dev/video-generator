import type { GenerateOptions, Job } from "@/lib/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export function authToken(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem("vidforge_token");
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = authToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function createJob(options: GenerateOptions): Promise<Job> {
  const form = new FormData();
  form.set("prompt", options.prompt);
  form.set("negative_prompt", options.negative_prompt);
  form.set("duration", String(options.duration));
  form.set("aspect_ratio", options.aspect_ratio);
  form.set("resolution", options.resolution);
  if (options.seed !== null) form.set("seed", String(options.seed));
  if (options.image) form.set("image", options.image);

  return requestJson<Job>("/api/generate", { method: "POST", body: form });
}

export async function getJob(id: string): Promise<Job> {
  return requestJson<Job>(`/api/jobs/${encodeURIComponent(id)}`, { cache: "no-store" });
}

export async function getGallery(): Promise<Job[]> {
  return requestJson<Job[]>("/api/gallery");
}

export async function getHistory(): Promise<Job[]> {
  return requestJson<Job[]>("/api/history");
}

export async function deleteJob(id: string): Promise<void> {
  await requestJson<void>(`/api/jobs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function enhancePrompt(prompt: string): Promise<string> {
  const result = await requestJson<{ prompt: string }>("/api/enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return result.prompt;
}

export async function getAdminJobs(): Promise<Job[]> {
  return requestJson<Job[]>("/api/admin/jobs");
}

export async function getAdminStatus(): Promise<{ provider: string; gpu: { available: boolean; name: string | null } }> {
  return requestJson("/api/admin/status");
}

export function getMediaUrl(path: string): string {
  return `${API_URL}${path}`;
}
