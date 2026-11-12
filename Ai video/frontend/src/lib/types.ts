export type JobStatus = "queued" | "processing" | "done" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  prompt: string;
  negative_prompt: string;
  duration: number;
  aspect_ratio: string;
  resolution: string;
  seed: number | null;
  video_url: string | null;
  thumbnail_url: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface GenerateOptions {
  prompt: string;
  negative_prompt: string;
  duration: number;
  aspect_ratio: string;
  resolution: string;
  seed: number | null;
  image?: File | null;
}
