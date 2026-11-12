import shutil
import subprocess
from pathlib import Path

from app.config import settings
from app.providers import get_provider
from app.providers.base import VideoRequest
from app.services.storage import thumbnail_output_path, video_output_path


def create_video_thumbnail(video_path: Path, thumbnail_path: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        raise RuntimeError("ffmpeg was not found. Install ffmpeg and ensure it is on PATH.")
    result = subprocess.run(
        [
            ffmpeg,
            "-y",
            "-ss", "0.5",
            "-i", str(video_path),
            "-frames:v", "1",
            "-vf", "scale=640:-2",
            "-q:v", "3",
            str(thumbnail_path),
        ],
        capture_output=True,
        text=True,
        timeout=120,
        check=False,
    )
    if result.returncode or not thumbnail_path.is_file():
        raise RuntimeError(f"ffmpeg could not create a thumbnail: {result.stderr[-1000:]}")


def generate_video(job_id: str, request: VideoRequest) -> tuple[str, str]:
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    video_path = video_output_path(job_id)
    thumbnail_path = thumbnail_output_path(job_id)
    get_provider().generate(request, video_path)
    create_video_thumbnail(video_path, thumbnail_path)
    return video_path.name, thumbnail_path.name
