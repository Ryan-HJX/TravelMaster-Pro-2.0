from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma4:e2b"
    DEEPSEEK_API_KEY: str | None = None
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    TAVILY_API_KEY: str | None = None
    AMAP_API_KEY: str | None = None

    REDIS_URL: str = "redis://localhost:6379/0"
    AI_TASK_STREAM: str = "travelmaster:ai:tasks"
    JAVA_CALLBACK_BASE_URL: str = "http://localhost:8080/api/internal/ai/tasks"
    INTERNAL_API_TOKEN: str = "travelmaster-internal-token"
    ENABLE_STREAM_WORKER: bool = True
    STREAM_START_ID: str = "$"
    EXTERNAL_TIMEOUT_SECONDS: float = 10.0
    MOCK_EXTERNAL: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
