from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "TN Archival Tool"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = Field(default="/api/v1", validation_alias="API_V1_PREFIX")

    host: str = "0.0.0.0"
    port: int = 8000

    database_url: str = Field(
        default="postgresql+asyncpg://archival:archival@localhost:5432/tn_archival",
        validation_alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    secret_key: str = Field(default="change-me", validation_alias="SECRET_KEY")

    access_token_expire_hours: int = 8
    cors_origins: str = "http://localhost:5173"
    evidence_storage_path: str = "../evidence"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
