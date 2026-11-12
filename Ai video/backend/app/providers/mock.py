import shutil
import subprocess
from pathlib import Path

from app.providers.base import VideoProvider, VideoRequest


class MockProvider(VideoProvider):
    """Create a short, deterministic sample clip without requiring a GPU."""

    def generate(self, request: VideoRequest, output_path: Path) -> None:
        ffmpeg = shutil.which("ffmpeg")
        if not ffmpeg:
            raise RuntimeError("ffmpeg was not found. Install ffmpeg and ensure it is on PATH.")
        width, height = _dimensions(request.aspect_ratio, request.resolution)
        command = [
            ffmpeg,
            "-y",
            "-f", "lavfi",
            "-i", f"color=c=0x342953:s={width}x{height}:r=24:d={request.duration}",
            "-vf", "format=yuv420p",
            "-an",
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-movflags", "+faststart",
            str(output_path),
        ]
        result = subprocess.run(command, capture_output=True, text=True, timeout=180, check=False)
        if result.returncode:
            raise RuntimeError(f"ffmpeg could not create the sample video: {result.stderr[-1000:]}")


def _dimensions(aspect_ratio: str, resolution: str) -> tuple[int, int]:
    short_side = 480 if resolution == "480p" else 720
    dimensions = {
        "16:9": (short_side * 16 // 9, short_side),
        "9:16": (short_side, short_side * 16 // 9),
        "1:1": (short_side, short_side),
    }
    width, height = dimensions[aspect_ratio]
    return width - width % 2, height - height % 2
