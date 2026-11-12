from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_admin_user
from app.config import settings
from app.database import get_db
from app.models import GenerationJob, User
from app.schemas import JobResponse

router = APIRouter(prefix="/api/admin", tags=["administration"])


@router.get("/jobs", response_model=list[JobResponse])
def all_jobs(_: User = Depends(get_admin_user), db: Session = Depends(get_db)) -> list[JobResponse]:
    jobs = db.scalars(select(GenerationJob).order_by(GenerationJob.created_at.desc()).limit(200)).all()
    return [JobResponse.from_job(job) for job in jobs]


@router.get("/status")
def system_status(_: User = Depends(get_admin_user)) -> dict[str, object]:
    gpu: dict[str, object] = {"available": False, "name": None}
    if settings.provider == "local":
        try:
            import torch

            available = torch.cuda.is_available()
            gpu = {"available": available, "name": torch.cuda.get_device_name(0) if available else None}
        except ImportError as error:
            gpu = {"available": False, "name": None, "error": str(error)}
    return {"provider": settings.provider, "gpu": gpu}
