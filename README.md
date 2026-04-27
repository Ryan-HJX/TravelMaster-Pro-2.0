# TravelMaster 🌍 AI 智能旅游规划系统

TravelMaster 是一款基于 **LangGraph**、**Java Spring Boot** 和 **React** 构建的现代化 AI 旅游规划助手。它能够根据用户需求自动拆解任务、搜索实时信息、验证逻辑一致性，并最终生成带实时地图轨迹和天气预报的精美行程单。

## 🌟 核心特性

- **LangGraph 驱动的 AI 工作流**：采用 Planner-Researcher-Validator-Generator 架构，确保行程逻辑严密。
- **三端联动架构**：
  - **前端 (React + Vite)**：极致美观的 UI，实时高德地图轨迹渲染。
  - **Java 后端 (Spring Boot)**：负责业务持久化、用户历史记录管理（H2 数据库）。
  - **Python 后端 (FastAPI)**：AI 核心大脑，集成 Tavily 搜索引擎和多模态验证。
- **高德地图集成**：动态计算景点坐标，一键生成可视化旅游路线图。
- **实时天气预报**：根据目的地动态抓取未来 4-5 天的真实天气。

## 🛠️ 技术栈

| 层次 | 技术 |
| :--- | :--- |
| **AI 编排** | LangChain, LangGraph, Tavily Search API |
| **前端** | React 18, Vite, Tailwind CSS, AMap (高德) JS API 2.0 |
| **Java 后端** | Spring Boot 3, Spring WebFlux, JPA, H2 Database |
| **Python 后端** | FastAPI, Pydantic, asyncio |

## 🚀 快速开始

### 1. 环境准备
确保您的系统中已安装：
- Python 3.10+
- Java 17+ (JDK)
- Node.js 18+

### 2. 获取 API 密钥
您需要申请以下 Key 并填入配置文件：
- **高德地图 API**: 获取 `Key` 和 `安全密钥`。
- **Tavily Search API**: 用于 AI 实时搜索。
- **LLM API**: 如 OpenAI 或 阿里云 DashScope。

### 3. 配置文件设置
#### Python 后端 (`.env`)
```env
TAVILY_API_KEY=您的_Tavily_Key
DASHSCOPE_API_KEY=您的_LLM_Key
AMAP_API_KEY=您的_高德_Web端_Key
```

#### 前端 (`travel-master-frontend/.env`)
```env
VITE_AMAP_KEY=您的_高德_JSAPI_Key
VITE_AMAP_SECURITY_CODE=您的_高德_安全密钥
```

### 4. 启动项目
**第一步：启动 Python AI 服务 (Port 8000)**
```bash
pip install -r requirements.txt
python main.py
```

**第二步：启动 Java 持久化服务 (Port 8080)**
```bash
cd travel-master-backend
./mvnw spring-boot:run
```

**第三步：启动前端界面 (Port 5173)**
```bash
cd travel-master-frontend
npm install
npm run dev
```

## 📸 运行预览
1. 输入“北京 5 天深度游”。
2. AI 自动通过 Tavily 搜索景点。
3. 校验器确保景点营业时间和路线顺路。
4. 生成精美 Markdown 行程单。
5. 地图自动对焦显示所有景点标记与蓝色轨迹线。

## 📄 开源协议
MIT License
