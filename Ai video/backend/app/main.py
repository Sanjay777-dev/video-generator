from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.models import GenerationJob, User  # noqa: F401 - register model metadata
from app.routers import admin, auth, enhance, gallery, generate, jobs
from app.services.storage import get_storage, initialize_storage

Base.metadata.create_all(bind=engine)
initialize_storage()

app = FastAPI(title=settings.app_name, version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(generate.router)
app.include_router(jobs.router)
app.include_router(auth.router)
app.include_router(gallery.router)
app.include_router(enhance.router)
app.include_router(admin.router)
app.mount("/media", StaticFiles(directory=get_storage().media_root), name="media")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "provider": settings.provider}
