"""
模型工厂模块。

负责创建和管理 LLM 实例，支持本地 Ollama 与云端 DeepSeek 之间的自动回退 (Fallback)。
"""

from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from config.settings import settings


def get_llm_with_fallback():
    """
    获取带有 Fallback 机制的 LLM 实例。

    逻辑流程:
    1. 优先尝试使用本地的 ChatOllama (Gemma 4: E2B)。
    2. 如果本地服务不可用或调用失败，自动回退到云端的 ChatOpenAI (DeepSeek)。
    
    Returns:
        BaseChatModel: 配置好 Fallback 策略的 LangChain 模型对象。
    """
    # 1. 定义主模型：本地 Ollama
    local_model = ChatOllama(
        model=settings.OLLAMA_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0.7,  # 旅游规划需要一定的创造性
    )

    # 2. 定义备用模型：云端 DeepSeek
    # 只有当 DEEPSEEK_API_KEY 存在时才初始化备用模型
    fallback_models = []
    if settings.DEEPSEEK_API_KEY:
        cloud_model = ChatOpenAI(
            model="deepseek-chat",  # DeepSeek 的具体模型名
            api_key=settings.DEEPSEEK_API_KEY,
            base_url=settings.DEEPSEEK_BASE_URL,
            temperature=0.7,
        )
        fallback_models.append(cloud_model)

    # 3. 组合 Fallback 逻辑
    # .with_fallbacks() 会在主模型抛出异常时，按顺序尝试备用模型
    if fallback_models:
        return local_model.with_fallbacks(fallback_models)
    
    # 如果没有备用模型，则直接返回本地模型
    return local_model
