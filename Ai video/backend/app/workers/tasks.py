import logging

from app.database import SessionLocal
from app.config import settings
from app.models import GenerationJob
from app.providers.base import VideoRequest
from app.services.pipeline import generate_video
from app.services.storage import thumbnail_output_path, video_output_path
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.tasks.generate_job")
def generate_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.get(GenerationJob, job_id)
        if not job:
            logger.error("Generation job %s no longer exists", job_id)
            return
        job.status = "processing"
        job.progress = 10
        db.commit()
        request = VideoRequest(
            prompt=job.prompt,
            negative_prompt=job.negative_prompt,
            duration=job.duration,
            aspect_ratio=job.aspect_ratio,
            resolution=job.resolution,
            seed=job.seed,
            image_path=(settings.storage_dir / "uploads" / job.image_path) if job.image_path else None,
        )
        video_name, thumbnail_name = generate_video(job.id, request)
        job.video_path = video_name
        job.thumbnail_path = thumbnail_name
        job.status = "done"
        job.progress = 100
        db.commit()
    except Exception as error:
        logger.exception("Video generation failed for job %s", job_id)
        video_output_path(job_id).unlink(missing_ok=True)
        thumbnail_output_path(job_id).unlink(missing_ok=True)
        job = db.get(GenerationJob, job_id)
        if job:
            job.status = "failed"
            job.error = str(error)[:2000]
            db.commit()
    finally:
        db.close()
