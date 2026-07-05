"""
DataPulse Configuration Module
Loads settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    postgres_user: str = "datapulse"
    postgres_password: str = "changeme"
    postgres_db: str = "datapulse"
    postgres_host: str = "db"
    postgres_port: int = 5432

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def database_url_sync(self) -> str:
        return f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_rate_limit: int = 10
    api_rate_limit_window: int = 60

    # Dashboard
    dashboard_host: str = "0.0.0.0"
    dashboard_port: int = 8501

    # Scraper
    scraper_interval_hours: int = 24
    scraper_timeout: int = 30
    scraper_user_agent: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

    # Notifications
    notification_enabled: bool = False
    notification_type: str = "telegram"
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    email_from: Optional[str] = None
    email_to: Optional[str] = None

    # Backup
    backup_dir: str = "/app/data/backup"
    backup_retention_days: int = 7

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


settings = Settings()