from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Bailian (DashScope) ──────────────────────────────────────
    DASHSCOPE_API_KEY: str = ""
    BAILIAN_BASE_URL: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    BAILIAN_MAIN_MODEL: str = "qwen-plus"
    BAILIAN_FLASH_MODEL: str = "qwen-turbo"
    MODEL_PRIORITY: str = "cloud"  # "cloud" | "local"

    # ── Ollama (local fallback) ──────────────────────────────────
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma4:e2b"

    # ── MCP Endpoints ────────────────────────────────────────────
    AMAP_API_KEY: str = ""
    AMAP_MCP_URL: str = ""  # SSE endpoint from Bailian MCP marketplace
    YINGMI_MCP_URL: str = ""
    YINGMI_API_KEY: str = ""

    # ── Meituan Open Platform ────────────────────────────────────
    MEITUAN_API_KEY: str = ""
    MEITUAN_BASE_URL: str = "https://openapi.meituan.com"

    # ── Redis / Worker ───────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    AI_TASK_STREAM: str = "travelmaster:ai:tasks"
    JAVA_CALLBACK_BASE_URL: str = "http://localhost:8080/api/internal/ai/tasks"
    INTERNAL_API_TOKEN: str = "travelmaster-internal-token"
    ENABLE_STREAM_WORKER: bool = True
    STREAM_START_ID: str = "0"
    EXTERNAL_TIMEOUT_SECONDS: float = 60.0
    MOCK_EXTERNAL: bool = False

    # ── Security / CORS ──────────────────────────────────────────
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ── Limits ────────────────────────────────────────────────────
    MAX_POI_PER_REQUEST: int = 20

    # ── Database ──────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./travelmaster.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
