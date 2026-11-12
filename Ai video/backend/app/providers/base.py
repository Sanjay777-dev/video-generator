from abc import ABC, abstractmethod
from pathlib import Path

from pydantic import BaseModel


class VideoRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    duration: int
    aspect_ratio: str
    resolution: str
    seed: int | None = None
    image_path: Path | None = None


class VideoProvider(ABC):
    """Common contract for local and mock video generation engines."""

    @abstractmethod
    def generate(self, request: VideoRequest, output_path: Path) -> None:
        """Create an MP4 at output_path or raise a descriptive exception."""
