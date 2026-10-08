from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / "backend" / ".env"
ROOT_ENV_PATH = BASE_DIR / ".env"



class Settings(BaseSettings):
    NVIDIA_API_KEY: str = "PASTE_YOUR_KEY_HERE"
    NVIDIA_MODEL: str = "nvidia/nemotron-3.5-lightning-30b-a3b"
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

    JWT_SECRET: str = "c8f5e173d19ea2b6f4e19038290a1bc40284dfa6639c0e48719f90246a81e9b2"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite:///./news.db"
    FETCH_INTERVAL_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=[str(ENV_FILE_PATH), str(ROOT_ENV_PATH), ".env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )



    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_nvidia_configured(self) -> bool:
        key = self.NVIDIA_API_KEY.strip()
        return bool(key and key != "PASTE_YOUR_KEY_HERE" and len(key) > 8)

    def validate_nvidia_key_or_warn(self) -> str:
        if not self.is_nvidia_configured:
            return "NVIDIA_API_KEY is not configured or using placeholder. Set your key in backend/.env."
        return "NVIDIA_API_KEY configured."


settings = Settings()
