from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import GenerationJob, User
from app.schemas import JobResponse
from app.services.storage import get_storage

router = APIRouter(prefix="/api", tags=["gallery"])


@router.get("/gallery", response_model=list[JobResponse])
def gallery(
    limit: int = Query(48, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[JobResponse]:
    jobs = db.scalars(
        select(GenerationJob)
        .where(GenerationJob.status == "done")
        .order_by(GenerationJob.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return [JobResponse.from_job(job) for job in jobs]


@router.get("/history", response_model=list[JobResponse])
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[JobResponse]:
    jobs = db.scalars(
        select(GenerationJob)
        .where(GenerationJob.user_id == user.id)
        .order_by(GenerationJob.created_at.desc())
    ).all()
    return [JobResponse.from_job(job) for job in jobs]


@router.delete("/jobs/{job_id}", status_code=204)
def delete_job(
    job_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    job = db.get(GenerationJob, job_id)
    if not job or job.user_id != user.id:
        raise HTTPException(status_code=404, detail="Generation job not found.")
    for folder, filename in (
        ("videos", job.video_path),
        ("thumbnails", job.thumbnail_path),
        ("uploads", job.image_path),
    ):
        if filename:
            media_path = get_storage().media_path(folder, filename).resolve()
            if media_path.parent == get_storage().media_path(folder, "").resolve():
                media_path.unlink(missing_ok=True)
    db.delete(job)
    db.commit()
