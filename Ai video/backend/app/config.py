from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Application settings loaded from environment variables or .env."""

    app_name: str = "VidForge API"
    provider: str = "mock"
    database_url: str = f"sqlite:///{ROOT_DIR / 'vidforge.db'}"
    redis_url: str = "redis://redis:6379/0"
    storage_dir: Path = ROOT_DIR / "storage"
    cors_origins: str = "http://localhost:3000"
    max_upload_mb: int = 10
    max_prompt_length: int = 2000
    max_negative_prompt_length: int = 1000
    rate_limit_per_hour: int = Field(default=0, ge=0)
    admin_email: str = ""
    admin_password: str = ""
    prompt_enhancer_url: str = ""
    jwt_secret: str = "change-this-secret-before-deploying"
    local_model_id: str = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers"
    local_i2v_model_id: str = "Wan-AI/Wan2.1-I2V-14B-480P-Diffusers"
    local_device: str = "cuda"

    model_config = SettingsConfigDict(
        env_file=ROOT_DIR.parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
