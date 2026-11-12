from functools import lru_cache

from app.config import settings
from app.providers.base import VideoProvider


@lru_cache(maxsize=1)
def get_provider() -> VideoProvider:
    provider = settings.provider.lower()
    if provider == "mock":
        from app.providers.mock import MockProvider

        return MockProvider()
    if provider == "local":
        from app.providers.local import LocalProvider

        return LocalProvider()
    raise ValueError(f"Unsupported PROVIDER={settings.provider!r}; choose 'mock' or 'local'.")
