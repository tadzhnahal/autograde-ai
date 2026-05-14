from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str = "sqlite:///./autograde.db"

    storage_backend: str = "local"
    storage_path: str = "./storage"
    grading_workdir: str = "./grading_workdir"

    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    demo_login: bool = True

    cors_origins: str = "http://localhost:5173"

    grader_mode: str = "claude_cli"
    claude_bin: str = "claude"
    claude_timeout_seconds: int = 300


settings = Settings()
