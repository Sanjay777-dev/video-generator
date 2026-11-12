import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from functools import lru_cache

from app.config import settings


class StorageBackend(ABC):
    """Storage contract for media persistence; remote stores can implement the same paths."""

    @property
    @abstractmethod
    def media_root(self) -> Path: ...

    @abstractmethod
    def initialize(self) -> None: ...

    @abstractmethod
    def upload_path(self, filename: str) -> Path: ...

    @abstractmethod
    def video_path(self, job_id: str) -> Path: ...

    @abstractmethod
    def thumbnail_path(self, job_id: str) -> Path: ...

    @abstractmethod
    def media_path(self, folder: str, filename: str) -> Path: ...


class LocalStorage(StorageBackend):
    def __init__(self, root: Path) -> None:
        self.root = root

    @property
    def media_root(self) -> Path:
        return self.root

    def initialize(self) -> None:
        for folder in ("videos", "thumbnails", "uploads"):
            (self.root / folder).mkdir(parents=True, exist_ok=True)

    def upload_path(self, filename: str) -> Path:
        suffix = Path(filename).suffix.lower()
        return self.root / "uploads" / f"{uuid.uuid4().hex}{suffix}"

    def video_path(self, job_id: str) -> Path:
        return self.root / "videos" / f"{job_id}.mp4"

    def thumbnail_path(self, job_id: str) -> Path:
        return self.root / "thumbnails" / f"{job_id}.jpg"

    def media_path(self, folder: str, filename: str) -> Path:
        return self.root / folder / filename


@lru_cache(maxsize=1)
def get_storage() -> StorageBackend:
    return LocalStorage(settings.storage_dir)


def initialize_storage() -> None:
    get_storage().initialize()


def unique_upload_path(filename: str) -> Path:
    return get_storage().upload_path(filename)


def video_output_path(job_id: str) -> Path:
    return get_storage().video_path(job_id)


def thumbnail_output_path(job_id: str) -> Path:
    return get_storage().thumbnail_path(job_id)


def relative_storage_name(path: Path) -> str:
    return path.name
