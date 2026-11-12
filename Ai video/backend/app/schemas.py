from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.job import GenerationJob


class JobResponse(BaseModel):
    id: str
    status: str
    progress: int
    prompt: str
    negative_prompt: str
    duration: int
    aspect_ratio: str
    resolution: str
    seed: int | None
    video_url: str | None
    thumbnail_url: str | None
    error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_job(cls, job: GenerationJob) -> "JobResponse":
        return cls(
            id=job.id,
            status=job.status,
            progress=job.progress,
            prompt=job.prompt,
            negative_prompt=job.negative_prompt,
            duration=job.duration,
            aspect_ratio=job.aspect_ratio,
            resolution=job.resolution,
            seed=job.seed,
            video_url=f"/media/videos/{job.video_path}" if job.video_path else None,
            thumbnail_url=f"/media/thumbnails/{job.thumbnail_path}" if job.thumbnail_path else None,
            error=job.error,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )
