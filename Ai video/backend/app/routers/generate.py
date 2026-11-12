import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import get_optional_user
from app.config import settings
from app.database import get_db
from app.models import GenerationJob, User
from app.schemas import JobResponse
from app.services.storage import initialize_storage, unique_upload_path
from app.workers.tasks import generate_job

router = APIRouter(prefix="/api", tags=["generation"])
ALLOWED_IMAGE_TYPES = {"image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp"}
IMAGE_FORMATS = {"image/png": "PNG", "image/jpeg": "JPEG", "image/webp": "WEBP"}


@router.post("/generate", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_generation(
    prompt: str = Form(..., min_length=3),
    negative_prompt: str = Form("", max_length=1000),
    duration: int = Form(...),
    aspect_ratio: str = Form(...),
    resolution: str = Form(...),
    seed: int | None = Form(None, ge=0, le=2_147_483_647),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> JobResponse:
    prompt = prompt.strip()
    if len(prompt) < 3 or len(prompt) > settings.max_prompt_length:
        raise HTTPException(status_code=422, detail=f"Prompt must be 3-{settings.max_prompt_length} characters.")
    if len(negative_prompt) > settings.max_negative_prompt_length:
        raise HTTPException(status_code=422, detail="Negative prompt is too long.")
    if duration not in {3, 5, 8}:
        raise HTTPException(status_code=422, detail="Duration must be 3, 5, or 8 seconds.")
    if aspect_ratio not in {"16:9", "9:16", "1:1"}:
        raise HTTPException(status_code=422, detail="Aspect ratio must be 16:9, 9:16, or 1:1.")
    if resolution not in {"480p", "720p"}:
        raise HTTPException(status_code=422, detail="Resolution must be 480p or 720p.")
    if settings.rate_limit_per_hour > 0 and user:
        recent_jobs = db.scalar(
            select(func.count())
            .select_from(GenerationJob)
            .where(
                GenerationJob.user_id == user.id,
                GenerationJob.created_at >= datetime.now(timezone.utc) - timedelta(hours=1),
            )
        ) or 0
        if recent_jobs >= settings.rate_limit_per_hour:
            raise HTTPException(status_code=429, detail="Hourly generation limit reached. Try again later.")

    job_id = str(uuid.uuid4())
    image_name = None
    if image:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Image must be PNG, JPEG, or WebP.")
        initialize_storage()
        target = unique_upload_path(image.filename or "upload")
        size = 0
        try:
            with target.open("wb") as file:
                while chunk := await image.read(1024 * 1024):
                    size += len(chunk)
                    if size > settings.max_upload_mb * 1024 * 1024:
                        raise HTTPException(status_code=413, detail=f"Image cannot exceed {settings.max_upload_mb} MB.")
                    file.write(chunk)
        except Exception:
            target.unlink(missing_ok=True)
            raise
        try:
            with Image.open(target) as uploaded_image:
                if uploaded_image.format != IMAGE_FORMATS[image.content_type]:
                    raise HTTPException(status_code=415, detail="Image content does not match its declared file type.")
                if uploaded_image.width * uploaded_image.height > 40_000_000:
                    raise HTTPException(status_code=413, detail="Image dimensions cannot exceed 40 megapixels.")
                uploaded_image.verify()
        except (UnidentifiedImageError, OSError) as error:
            target.unlink(missing_ok=True)
            raise HTTPException(status_code=415, detail="Uploaded file is not a valid image.") from error
        except HTTPException:
            target.unlink(missing_ok=True)
            raise
        image_name = target.name

    job = GenerationJob(
        id=job_id,
        user_id=user.id if user else None,
        status="queued",
        prompt=prompt,
        negative_prompt=negative_prompt.strip(),
        duration=duration,
        aspect_ratio=aspect_ratio,
        resolution=resolution,
        seed=seed,
        image_path=image_name,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    try:
        generate_job.delay(job_id)
    except Exception as error:
        job.status = "failed"
        job.error = "Unable to contact the generation queue. Confirm Redis and the worker are running."
        db.commit()
        raise HTTPException(status_code=503, detail=job.error) from error
    return JobResponse.from_job(job)
