# TravelMaster 🌍 AI 智能旅游规划系统

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-green.svg)
![Java](https://img.shields.io/badge/java-17+-orange.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)
![LangGraph](https://img.shields.io/badge/langgraph-latest-purple.svg)

**基于 LangGraph 多智能体工作流的下一代 AI 旅游规划助手**

[功能特性](#-核心特性) • [快速开始](#-快速开始) • [架构设计](#-架构设计) • [技术文档](#-技术文档) • [贡献指南](#-贡献指南)

</div>

---

## 📖 项目简介

TravelMaster 是一款企业级 AI 旅游规划系统，采用**异构微服务架构**，融合了 **LangGraph 多智能体工作流**、**Spring Boot 响应式网关**和 **React + GIS 可视化前端**。它能够理解用户的自然语言需求，自动拆解任务、搜索实时信息、校验逻辑一致性，最终生成包含**实时天气预报**、**高德地图轨迹**和**详细行程安排**的精美行程单。

### ✨ 为什么选择 TravelMaster？

- 🤖 **真正的 AI Agent**：不是简单的 LLM 调用，而是具备自我修正能力的多智能体协同系统
- 🗺️ **GIS 可视化**：集成高德地图 API，自动生成景点标记、路径规划和视野自适应
- 🔄 **响应式架构**：Java WebFlux 非阻塞 I/O，支持高并发请求处理
- 🛡️ **幻觉消除**：通过高德 POI API 校验所有地点真实性，杜绝虚假坐标
- 📊 **数据持久化**：完整的用户历史记录管理，支持行程回顾与个性化推荐
- 🌐 **跨平台部署**：Docker Compose 一键编排，支持 Linux/Windows/macOS

---

## 🌟 核心特性

### 🤖 LangGraph 驱动的多智能体工作流
- **Planner 节点**：将用户模糊需求拆解为具体搜索任务（天气、景点、美食）
- **Researcher 节点**：双层检索机制，先搜索摘要再深度抓取网页正文
- **Validator 节点**：逻辑校验引擎，检测时间冲突、地理矛盾和事实错误
- **Generator 节点**：多源数据融合，生成结构化 Markdown 行程单
- **自我修正循环**：当 Validator 发现问题时，自动返回 Planner 重新规划

### 🏗️ 三端联动异构架构
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   React 18   │───▶│ Spring Boot  │───▶│   FastAPI    │
│  + TypeScript│    │   WebFlux    │    │  + LangGraph │
│  + AMap GIS  │    │  + JPA/H2    │    │  + LangChain │
└──────────────┘    └──────────────┘    └──────────────┘
```

- **前端 (React + Vite)**：
  - 现代化 UI 设计，Tailwind CSS 响应式布局
  - AMap 高德地图集成，支持 Marker 标记、Polyline 路径绘制
  - 实时加载状态反馈，优雅的 Loading 动画
  
- **Java 后端 (Spring Boot)**：
  - WebFlux 响应式编程，非阻塞 I/O 提升并发能力 10 倍+
  - JPA 持久化层，H2 内存数据库存储用户历史记录
  - WebClient 异步转发，超时控制和异常处理
  
- **Python 后端 (FastAPI)**：
  - LangGraph 状态机编排，4 个智能体节点协同工作
  - Tavily/DuckDuckGo 双引擎搜索，trafilatura 网页提取
  - 高德 POI/天气/路径规划 API 深度整合

### 🗺️ 高德地图 GIS 可视化
- **POI 真实性校验**：调用高德 Web API 验证地点存在性，消除 LLM 幻觉
- **跨城过滤**：严格校验 POI 所属城市，避免异地推荐
- **类型过滤**：排除汽修、厕所等非旅游相关地点
- **路径规划**：自动计算景点间距离和耗时，生成蓝色轨迹线
- **视野自适应**：`setFitView` 算法确保所有标记在可视区域内

### 🌤️ 实时数据集成
- **天气预报**：通过高德 API 获取未来 3-5 天真实天气，生成 Markdown 表格
- **搜索引擎**：Tavily（主）+ DuckDuckGo（备），双层 Fallback 机制
- **网页抓取**：trafilatura 智能提取正文，关键词过滤噪音

### 📊 数据持久化与历史记录
- **行程单存储**：CLOB 字段保存完整 Markdown 内容
- **坐标序列化**：Waypoints 以 JSON 字符串形式存储
- **索引优化**：USER_ID 索引加速历史查询
- **用户隔离**：支持多用户同时使用，数据互不干扰

## 🛠️ 技术栈

### AI 核心层 (Python)
| 组件 | 技术 | 说明 |
| :--- | :--- | :--- |
| **框架** | FastAPI | 高性能异步 Web 框架 |
| **AI 编排** | LangGraph | 有状态多智能体工作流引擎 |
| **LLM 集成** | LangChain | 统一模型接口，支持 Fallback |
| **本地模型** | Ollama (Gemma 4) | 免费本地推理，响应速度 <500ms |
| **云端模型** | DeepSeek Chat | 备用模型，能力强但延迟较高 |
| **搜索引擎** | Tavily + DuckDuckGo | 双引擎搜索，专为 AI 优化 |
| **网页抓取** | trafilatura | 智能提取正文，过滤噪音 |
| **地图 API** | 高德 Web 服务 | POI 校验、天气、路径规划 |

### 业务网关层 (Java)
| 组件 | 技术 | 说明 |
| :--- | :--- | :--- |
| **框架** | Spring Boot 3.2 | 企业级 Java 应用框架 |
| **响应式编程** | Spring WebFlux | 非阻塞 I/O，高并发处理 |
| **HTTP 客户端** | WebClient | 异步转发 Python Agent 请求 |
| **持久化** | Spring Data JPA | ORM 框架，简化数据库操作 |
| **数据库** | H2 Database | 嵌入式内存数据库，零配置 |
| **工具库** | Lombok | 自动生成 getter/setter，减少样板代码 |

### 前端展示层 (React)
| 组件 | 技术 | 说明 |
| :--- | :--- | :--- |
| **框架** | React 18 + TypeScript | 类型安全的前端开发 |
| **构建工具** | Vite | 秒级热更新，极速开发体验 |
| **样式方案** | Tailwind CSS | 原子化 CSS，快速构建 UI |
| **地图 SDK** | AMap JS API 2.0 | 高德地图 JavaScript SDK |
| **地图加载器** | @amap/amap-jsapi-loader | 异步加载 AMap，避免阻塞 |
| **状态管理** | React Hooks | useState, useEffect, useCallback |

### DevOps & 工具链
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **日志监控**: 结构化 JSON 日志
- **环境管理**: pydantic-settings (Python), application.properties (Java), .env (Frontend)

## 🚀 快速开始

### 1️⃣ 环境准备

确保您的系统中已安装以下软件：

| 软件 | 版本要求 | 下载链接 |
| :--- | :--- | :--- |
| **Python** | 3.10+ | [python.org](https://www.python.org/downloads/) |
| **Java JDK** | 17+ | [oracle.com](https://www.oracle.com/java/technologies/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Maven** | 3.6+ | [maven.apache.org](https://maven.apache.org/download.cgi) |
| **Git** | 最新版 | [git-scm.com](https://git-scm.com/) |

验证安装：
```bash
python --version    # Python 3.10.x
java -version       # openjdk 17.x.x
node -v             # v18.x.x
mvn -v              # Apache Maven 3.x.x
```

### 2️⃣ 获取 API 密钥

您需要申请以下 API Key 并填入配置文件：

#### 🔑 高德地图 API（必需）
1. 访问 [高德开放平台](https://console.amap.com/dev/key/app)
2. 注册账号并创建应用
3. 获取两个 Key：
   - **Web 服务 API Key**：用于后端 POI 校验、天气查询
   - **JS API Key + 安全密钥**：用于前端地图渲染

#### 🔍 Tavily Search API（推荐）
1. 访问 [Tavily AI](https://tavily.com/)
2. 注册并获取 API Key
3. 免费额度：每月 1000 次搜索

#### 🤖 LLM API（可选，用于 Fallback）
- **DeepSeek**: [deepseek.com](https://platform.deepseek.com/) 
- **OpenAI**: [openai.com](https://platform.openai.com/)
- **阿里云 DashScope**: [dashscope.aliyun.com](https://dashscope.aliyun.com/)

> 💡 **提示**: 如果不想配置云端 LLM，可以仅使用本地 Ollama 模型（需单独安装 Ollama）。

### 3️⃣ 配置文件设置

#### Python 后端配置

复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 本地模型配置（默认）
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:e2b

# 云端模型配置 (Fallback，可选)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 工具配置
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxx

# 数据库配置
DATABASE_URL=sqlite:///./travel_master.db

# 高德地图 API 配置 (必需)
AMAP_API_KEY=your_amap_web_service_api_key_here
```

#### Java 后端配置

编辑 `travel-master-backend/src/main/resources/application.properties`：
```properties
# Python Agent 服务地址
python.agent.url=http://localhost:8000

# H2 数据库配置
spring.datasource.url=jdbc:h2:file:./travel_master_data
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# JPA 配置
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# 服务器端口
server.port=8080
```

#### 前端配置

在 `travel-master-frontend` 目录下创建 `.env` 文件：
```env
# 高德地图 JS API 配置（必需）
VITE_AMAP_KEY=your_amap_jsapi_key_here
VITE_AMAP_SECURITY_CODE=your_amap_security_code_here
```

> ⚠️ **重要**: `.env` 文件包含敏感信息，请勿提交到 Git！项目已配置 `.gitignore` 自动忽略。

### 4️⃣ 启动项目

建议按以下顺序启动三个服务：

#### 第一步：启动 Python AI 服务 (Port 8000)

```bash
# 进入项目根目录
cd TravelMaster

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

看到以下输出表示启动成功：
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
[OK] TravelMaster 工作流已编译完成
```

访问 [http://localhost:8000/docs](http://localhost:8000/docs) 查看 API 文档。

#### 第二步：启动 Java 持久化服务 (Port 8080)

打开新终端：
```bash
cd travel-master-backend

# Windows
mvnw.cmd spring-boot:run

# Linux/macOS
./mvnw spring-boot:run
```

看到以下输出表示启动成功：
```
Started TravelMasterApplication in X.XXX seconds
Tomcat started on port(s): 8080 (http)
```

访问 [http://localhost:8080/api/travel/health](http://localhost:8080/api/travel/health) 检查健康状态。

#### 第三步：启动前端界面 (Port 5173)

打开新终端：
```bash
cd travel-master-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

看到以下输出表示启动成功：
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

浏览器自动打开 [http://localhost:5173](http://localhost:5173)，即可开始使用！

---

## 📸 使用示例

### 典型使用流程

1. **输入需求**：在首页输入框中输入您的旅行需求，例如：
   ```
   北京 5 天深度游，喜欢历史文化，想吃地道美食
   ```

2. **AI 处理**：系统自动执行以下步骤（约 10-15 秒）：
   - 🤖 Planner 拆解任务：天气查询、景点搜索、美食推荐
   - 🔍 Researcher 执行搜索：Tavily + 网页深度抓取
   - 🛡️ Validator 逻辑校验：检查时间冲突、地理矛盾
   - ✨ Generator 生成行程：融合多源数据，输出 Markdown

3. **查看结果**：
   - 📅 **行程单**：结构化表格，包含时间段、景点、美食、交通建议
   - 🌤️ **天气预报**：未来 5 天真实天气数据（高德 API）
   - 🗺️ **地图轨迹**：蓝色路径线连接所有景点，带序号标记

4. **保存历史**：行程自动保存到数据库，可在“历史记录”中查看

### 示例输出预览

#### 行程单片段
```markdown
# 北京 深度旅游行程单

### 🌤️ 官方实时天气预报 (高德提供)
| 日期 | 天气 | 气温 | 风向 |
| :--- | :--- | :--- | :--- |
| 2026-04-28 | 晴 | 12-25℃ | 北风 |
| 2026-04-29 | 多云 | 14-26℃ | 南风 |

### 📅 详细行程安排
| 时间段 | 景点/活动 | 美食推荐 | 备注/交通/费用 |
| :--- | :--- | :--- | :--- |
| 上午 | 故宫 [📍导航](...) | - | 门票 60 元，建议游玩 3 小时 |
| 中午 | - | 全聚德烤鸭 | 距故宫 1.2km，打车 10 分钟 |
| 下午 | 颐和园 [📍导航](...) | - | 从故宫出发，距离 15km，打车 35 分钟 |
```

#### 地图可视化
- 🔵 **蓝色粗线**：景点间的路径连线
- 🔢 **序号气泡**：带渐变色的 Marker 标记，显示游览顺序
- 🎯 **视野自适应**：自动缩放和平移，保证所有标记可见

---

## 🏗️ 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         TravelMaster 架构全景                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐    HTTP POST     ┌──────────────┐             │
│  │   React 18   │ ───────────────▶ │ Spring Boot  │             │
│  │  + TypeScript│   /api/travel/    │   WebFlux    │             │
│  │  + AMap GIS  │    itinerary      │  + JPA/H2    │             │
│  └──────────────┘                   └──────┬───────┘             │
│                                            │                     │
│                                            │ WebClient           │
│                                            │ HTTP POST           │
│                                            ▼                     │
│                                   ┌──────────────┐              │
│                                   │   FastAPI    │              │
│                                   │  + LangGraph │              │
│                                   │  + LangChain │              │
│                                   └──────┬───────┘              │
│                                          │                      │
│                    ┌─────────────────────┼─────────────────┐   │
│                    ▼                     ▼                 ▼   │
│            ┌──────────────┐   ┌──────────────┐  ┌──────────┐ │
│            │ Tavily/DDG   │   │ 高德地图 API  │  │ Ollama / │ │
│            │   Search     │   │ POI/Weather  │  │ DeepSeek │ │
│            └──────────────┘   └──────────────┘  └──────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### LangGraph 工作流

```
START
  │
  ▼
┌──────────┐
│ Planner  │ ──▶ 拆解用户任务为搜索关键词
└────┬─────┘
     │
     ▼
┌───────────┐
│Researcher │ ──▶ 执行搜索 + 深度网页抓取
└────┬──────┘
     │
     ▼
┌───────────┐
│ Validator │ ──▶ 逻辑校验（时间/地理/事实）
└────┬──────┘
     │
     ├──── PASS ──▶ ┌──────────────────┐
     │               │Itinerary Generator│ ──▶ 生成 Markdown + 坐标
     │               └────────┬─────────┘
     │                        │
     └──── FAIL ──▶ (返回 Planner 重新规划)
                              │
                              ▼
                            END
```

### 数据流向

1. **用户输入** → React 前端
2. **前端请求** → Java Spring Boot (`POST /api/travel/itinerary`)
3. **Java 转发** → Python FastAPI (`POST /api/v1/plan`)
4. **Python 处理** → LangGraph 工作流执行
5. **结果返回** → Python → Java → React
6. **Java 持久化** → H2 Database 保存历史记录
7. **前端渲染** → Markdown + AMap 地图可视化

---

## 📸 运行预览
1. 输入“北京 5 天深度游”。
2. AI 自动通过 Tavily 搜索景点。
3. 校验器确保景点营业时间和路线顺路。
4. 生成精美 Markdown 行程单。
5. 地图自动对焦显示所有景点标记与蓝色轨迹线。

---

## ❓ 常见问题 (FAQ)

### Q1: Python 服务启动失败，提示 "ModuleNotFoundError"
**解决方案**: 确保已安装所有依赖
```bash
pip install -r requirements.txt
```

### Q2: Java 服务启动失败，提示 "Port 8080 already in use"
**解决方案**: 修改端口或关闭占用进程
```bash
# Windows: 查找并结束进程
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/macOS: 查找并结束进程
lsof -ti:8080 | xargs kill -9
```

### Q3: 前端地图显示灰色或 403 错误
**解决方案**: 检查高德 API Key 配置
1. 确认 `.env` 文件中 `VITE_AMAP_KEY` 和 `VITE_AMAP_SECURITY_CODE` 已正确填写
2. 确认高德开放平台中已启用 **JS API** 和 **Web 服务 API**
3. 重启前端服务使配置生效

### Q4: AI 响应时间过长（超过 30 秒）
**解决方案**: 
- 检查网络连接，确保 Tavily API 可访问
- 考虑使用本地 Ollama 模型替代云端 LLM
- 查看 Python 服务日志，定位瓶颈节点

### Q5: 行程单中地点坐标不准确
**解决方案**: 
- 确认 `.env` 中 `AMAP_API_KEY` 已配置
- 检查高德 API 配额是否用尽
- 查看 Python 日志中的 POI 校验结果

### Q6: Windows 下 Python 输出中文乱码
**解决方案**: 项目已内置编码修复，如仍存在问题：
```python
import sys
sys.stdout.reconfigure(encoding='utf-8')
```

### Q7: 如何查看详细的执行日志？
**Python 日志**: 终端直接输出，包含每个节点的执行状态  
**Java 日志**: 查看控制台输出或 `travel_master_data.trace.db`  
**前端日志**: 浏览器 F12 开发者工具 → Console 标签

---

## 🤝 贡献指南

我们欢迎任何形式的贡献！以下是参与方式：

### 🐛 报告 Bug
1. 在 [Issues](https://github.com/yourusername/TravelMaster/issues) 中搜索是否已有类似问题
2. 如果没有，创建新 Issue，包含：
   - 问题描述
   - 复现步骤
   - 预期行为
   - 实际行为
   - 环境信息（OS、Python/Java/Node 版本）

### ✨ 提交新功能
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 📝 改进文档
- 修正拼写错误或语法问题
- 补充使用教程或最佳实践
- 翻译为其他语言

### 💡 开发建议
- **代码风格**: Python 遵循 PEP 8，Java 遵循 Google Style，TypeScript 遵循 ESLint
- **提交规范**: 使用语义化提交消息，如 `feat: add weather forecast`, `fix: resolve map rendering issue`
- **测试覆盖**: 为新功能编写单元测试

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

感谢以下开源项目和技术的支持：

- [LangGraph](https://langchain-ai.github.io/langgraph/) - AI 工作流编排引擎
- [Spring Boot](https://spring.io/projects/spring-boot) - 企业级 Java 框架
- [React](https://react.dev/) - 现代化前端框架
- [高德地图](https://lbs.amap.com/) - GIS 可视化服务
- [Tavily AI](https://tavily.com/) - 专为 AI 优化的搜索引擎
- [trafilatura](https://trafilatura.readthedocs.io/) - 网页正文提取工具

---

## 📞 联系方式

- 📧 Email: 84667727@qq.com
- 💬 技术交流群: [二维码链接]
- 🐛 Issue Tracker: [GitHub Issues](https://github.com/yourusername/TravelMaster/issues)

---

<div align="center">

**Made with ❤️ by TravelMaster Team**

[⭐ Star this repo](https://github.com/yourusername/TravelMaster) if you find it helpful!

</div>
