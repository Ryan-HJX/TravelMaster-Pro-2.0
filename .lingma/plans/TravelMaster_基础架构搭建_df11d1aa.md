# TravelMaster 基础架构搭建

## 1. 目录结构设计 (初学者友好)
为了兼顾“初学者易懂”与“企业级规范”，我们将采用分层模块化结构：
- `config/`: 存放配置加载逻辑（`.env` 解析）。
- `db/`: 存放数据库初始化与操作脚本。
- `agents/`: 存放 LangGraph 的核心节点逻辑。
- `tools/`: 存放搜索工具与自定义 SQL 工具。
- `main.py`: 程序的入口点。

## 2. 企业级配置管理 (`config/settings.py`)
- 使用 `pydantic-settings` 库实现强类型配置管理。
- 支持从 `.env` 文件读取环境变量，并提供默认值校验。
- 统一管理 Ollama 地址、DeepSeek API Key、Tavily API Key 等敏感信息。

## 3. 模型工厂实现 (`core/model_factory.py`)
- **逻辑流程**: 
  1. 尝试初始化本地 `ChatOllama` (Gemma 4: E2B)。
  2. 如果本地连接失败或用户指定，自动回退到云端 `ChatOpenAI` (DeepSeek)。
  3. 使用 LangChain 的 `.with_fallbacks()` 方法封装，确保在运行时也能自动切换。
- **代码要点**: 定义统一的 `BaseModel` 接口，确保不同模型返回的消息格式一致。

## 4. 依赖管理 (`requirements.txt`)
- 列出项目所需的核心库：`langgraph`, `langchain-ollama`, `langchain-openai`, `pydantic-settings`, `aiosqlite`。

## 5. 实施步骤
1. 创建上述目录结构。
2. 编写 `config/settings.py` 实现配置加载。
3. 编写 `core/model_factory.py` 实现模型切换逻辑。
4. 编写 `requirements.txt`。