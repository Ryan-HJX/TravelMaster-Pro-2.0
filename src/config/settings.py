"""
企业级配置管理模块。

使用 pydantic-settings 实现强类型配置加载，支持从 .env 文件读取环境变量。
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    应用全局配置类。

    属性:
        OLLAMA_BASE_URL (str): Ollama 服务的基础地址。
        OLLAMA_MODEL (str): 默认使用的 Ollama 模型名称。
        DEEPSEEK_API_KEY (str): DeepSeek API 的密钥（用于 Fallback）。
        DEEPSEEK_BASE_URL (str): DeepSeek API 的基础地址。
        TAVILY_API_KEY (str): Tavily 搜索工具的 API 密钥。
        DATABASE_URL (str): SQLite 数据库的连接字符串。
    """

    # --- 本地模型配置 ---
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma4:e2b"

    # --- 云端模型配置 (Fallback) ---
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"

    # --- 工具配置 ---
    TAVILY_API_KEY: Optional[str] = None

    # --- 数据库配置 ---
    DATABASE_URL: str = "sqlite:///./travel_master.db"

    # --- 高德地图配置 ---
    AMAP_API_KEY: Optional[str] = None

    # 配置 pydantic-settings 的行为：从 .env 文件读取
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,  # 不区分大小写
        extra="ignore"         # 忽略 .env 中未定义的字段
    )

    def is_ollama_available(self) -> bool:
        """
        检查 Ollama 服务是否可用（预留逻辑，实际可在启动时调用）。
        """
        # 这里可以添加简单的 ping 逻辑
        return True


# 创建一个全局单例实例，方便在其他模块直接导入使用
settings = Settings()
