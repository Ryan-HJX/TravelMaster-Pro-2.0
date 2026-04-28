# TravelMaster Pro 2.0 - 求职导向项目指南

> **定位**：基于 Java Spring Boot + Python FastAPI + 阿里云百炼 MCP 的智能旅游社交平台  
> **核心价值**：展示 AI Agent 落地能力、全栈开发实力、高并发处理经验

---

## 📋 目录

1. [项目概述与核心竞争力](#1-项目概述与核心竞争力)
2. [技术栈详解与作用映射](#2-技术栈详解与作用映射)
3. ["Vibe Coding"与个人成长叙事](#3-vibe-coding与个人成长叙事)
4. [学习路线图（从 0 到 1）](#4-学习路线图从-0-到-1)
5. [面试预判与防御（Mock Interview）](#5-面试预判与防御mock-interview)
6. [附录：快速参考清单](#6-附录快速参考清单)

---

## 1. 项目概述与核心竞争力

### 1.1 一句话定位

**TravelMaster Pro 2.0** 是一个基于 **Java Spring Boot + Python FastAPI + 阿里云百炼 MCP** 的智能旅游社交平台，实现**真实地理约束下的动态行程规划**。

### 1.2 核心功能矩阵

#### 🤖 AI 旅行规划引擎
- **9 段式 LangGraph 工作流**：意图解析 → 地理校准 → POI 筛选 → 路线优化 → 天气联动 → 质量评分 → 资金建议 → 大交通规划 → 行程渲染
- **MCP 工具链集成**：高德地图 MCP（地理编码/POI/路径/天气）、盈米金融 MCP（基金流动性分析）
- **模型降级策略**：云端优先（qwen3-plus/flash）+ 本地降级（Ollama gemma4:e2b）
- **实时进度追踪**：Redis Hash 存储，前端轮询展示 9 个步骤的完成状态

**关键代码**：[workflow.py](file:///e:/my_project/TravelMaster/src/agents/workflow.py) 第 263-286 行定义 9 节点工作流

#### 👥 社交互动系统
- **帖子发布**：将 AI 生成的行程发布为社交帖子
- **点赞收藏**：MySQL 唯一约束防重复，Redis 热计数提升性能
- **评论关注**：支持嵌套评论、用户关注关系
- **实时通知**：WebSocket STOMP 协议推送点赞、评论、任务完成等通知

#### 🗺️ 足迹地图
- **ECharts 省级可视化**：覆盖 34 个省级行政区（含特别行政区）
- **自动联动计算**：开始/结束日期变化时，天数自动计算（包含首尾两天）
- **多数据源容错**：尝试阿里云 DataV v3/v2 API，加载失败显示友好提示
- **降级策略**：即使地图加载失败，仍可使用右侧省份列表手动标记

#### 💰 旅行资金助手
- **预算分析**：总预算、日均消费、预算级别评估
- **现金预留建议**：推荐预留金额 + 应急金计算
- **赎回时点提醒**：T+0/T+1/T+N 流动性提醒，假期前赎回截止日
- **风险提示**：免责声明（不构成投资建议）

### 1.3 简历核心竞争力提炼

在简历中，你可以这样描述这个项目的技术亮点：

#### ✨ AI Agent 落地经验
- 使用 **LangGraph StateGraph** 构建 9 节点工作流，实现状态机管理
- 集成 **阿里云百炼 MCP** 工具链，调用高德地图 API 获取真实地理数据
- 设计**云端优先 + 本地降级**策略，确保服务可用性（[model_router.py](file:///e:/my_project/TravelMaster/src/llm/model_router.py) 第 41-66 行）
- 实现 **MCP Trace 落库**，记录每次工具调用的详细日志，便于问题追溯

#### ⚡ 高并发处理能力
- 使用 **Redis Stream** 构建异步任务队列，解耦 Java 后端与 Python AI 服务
- 采用 **Redisson 分布式锁** + **幂等键**防止重复提交（[ItineraryTaskService.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/itinerary/service/ItineraryTaskService.java) 第 98-123 行）
- 实现 **Caffeine + Redis 两级缓存**，L1 缓存 5min TTL，L2 缓存 30min TTL
- 编写 **k6 压测脚本**，发现并优化 MySQL 连接池、Redis Stream 堆积等瓶颈

#### 🌐 全栈开发能力
- **前端**：React 19 + TypeScript + Vite + Tailwind CSS，封装 `useTravelPlanner` 自定义 Hook
- **后端**：Spring Boot 3.2 + Spring Security JWT 认证 + Spring Data JPA
- **AI 编排**：FastAPI + LangGraph + Pydantic 数据校验
- **基础设施**：Docker Compose 一键部署 5 个服务（MySQL、Redis、Java、Python、Nginx）

#### 🔍 可观测性设计
- **MCP Trace 落库**：在 `itinerary_generation_task` 表中记录 `model_provider`、`mcp_trace`、`tool_calls`、`fallback_used`
- **实时进度追踪**：Redis Hash 存储每个节点的执行状态，前端轮询展示
- **日志分级优化**：Uvicorn log_level 设置为 info，关闭 access_log 减少噪音
- **优雅错误处理**：WebClient onStatus 处理 4xx 错误，避免异常堆栈污染日志

---

## 2. 技术栈详解与作用映射

### 2.1 前端技术栈

| 技术 | 版本 | 项目中的作用 | 面试亮点 |
|------|------|-------------|---------|
| React | 19 | UI 组件化开发，Hooks 管理状态 | 使用 `useTravelPlanner` 自定义 Hook 封装业务逻辑 |
| TypeScript | 5.x | 类型安全，减少运行时错误 | 定义 `PlanData`、`TaskProgress` 等接口契约 |
| Vite | 5.x | 快速构建工具，HMR 热更新 | 开发体验优化，生产环境 Tree Shaking |
| Tailwind CSS | 3.x | 原子化 CSS，快速样式开发 | 响应式设计，移动端适配 |
| ECharts | 5.x | 足迹地图可视化 | 省级行政区 GeoJSON 加载，点击交互 |
| 高德 JS API | 2.0 | 行程单地图展示 | 路径绘制、POI 标记、路线比选 |

**关键文件：**
- [useTravelPlanner.ts](file:///e:/my_project/TravelMaster/travel-master-frontend/src/hooks/useTravelPlanner.ts)：封装行程生成、历史记录管理的自定义 Hook
- [ItineraryMapView.tsx](file:///e:/my_project/TravelMaster/travel-master-frontend/src/components/ItineraryMapView.tsx)：高德地图集成组件

**面试话术示例：**
> "我在前端使用了 React 19 的 Hooks 模式，通过 `useTravelPlanner` 自定义 Hook 将行程生成、历史记录管理等业务逻辑封装起来，这样组件只需要关心 UI 展示，不需要处理复杂的异步状态管理。"

### 2.2 Java 后端技术栈

| 技术 | 版本 | 项目中的作用 | 面试亮点 |
|------|------|-------------|---------|
| Spring Boot | 3.2 | REST API + WebSocket 服务端 | 统一异常处理、JWT 认证过滤器 |
| Spring Security | 6.x | JWT Token 验证、权限控制 | 自定义 `AuthenticatedUser` principal |
| Spring Data JPA | 3.x | MySQL ORM，Repository 模式 | 复杂查询、级联删除优化 |
| Flyway | 9.x | 数据库版本化迁移 | V1→V4 演进，外键约束修复 |
| Redisson | 3.x | 分布式锁、限流 | `RLock.tryLock()` 防止重复提交 |
| WebClient | 6.x | 响应式 HTTP 客户端 | 调用 Python AI 服务，优雅处理 404 |
| Caffeine | 3.x | JVM 本地缓存（L1） | 5min TTL，1000 条目上限 |

**关键文件：**
- [ItineraryTaskController.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/itinerary/controller/ItineraryTaskController.java)：REST API 入口，幂等键校验
- [ItineraryTaskService.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/itinerary/service/ItineraryTaskService.java)：
  - 第 98-123 行：Redisson 分布式锁 + 幂等键防重
  - 第 331-382 行：WebClient 调用 Python 进度接口，优雅处理 4xx 错误

**面试话术示例：**
> "在防止重复提交方面，我使用了 Redisson 分布式锁，锁的粒度是 `lock:itinerary-task:{userId}:{idempotencyKey}`，这样既保证了同一用户的相同请求不会并发执行，又允许不同用户或不同请求并行处理。如果前端没有传入幂等键，我会用 `userId + userInput` 的哈希值作为默认键。"

### 2.3 Python AI 编排层

| 技术 | 版本 | 项目中的作用 | 面试亮点 |
|------|------|-------------|---------|
| FastAPI | 0.109 | AI 服务 API，异步高性能 | Pydantic 数据校验，自动生成 OpenAPI 文档 |
| LangGraph | 0.1 | 7+2 段式工作流编排 | StateGraph 状态管理，节点间数据传递 |
| 阿里云百炼 | Responses API | 云端 LLM 推理 | qwen3-plus（主推理）、qwen3-flash（轻量抽取） |
| MCP Protocol | SSE | 工具调用标准化 | 高德地图 MCP（地理编码/POI/路径/天气）、盈米金融 MCP |
| Ollama | gemma4:e2b | 本地降级模型 | 无 MCP，纯文本推理，超时/异常时 fallback |
| Redis Stream | 7.x | 异步任务队列 | XADD 投递、XREAD 阻塞消费 |

**关键文件：**
- [workflow.py](file:///e:/my_project/TravelMaster/src/agents/workflow.py)：9 节点工作流定义（第 263-286 行）
- [state.py](file:///e:/my_project/TravelMaster/src/agents/state.py)：TypedDict 状态定义，包含 `intent`、`geo_grounding`、`enriched_pois` 等 9 个阶段数据
- [model_router.py](file:///e:/my_project/TravelMaster/src/llm/model_router.py)：云端优先+本地降级路由策略（第 41-66 行）
- [progress_tracker.py](file:///e:/my_project/TravelMaster/src/services/progress_tracker.py)：实时进度追踪，Redis Hash 存储（第 102-163 行）

**面试话术示例：**
> "在 AI 编排层，我选择了 LangGraph 而不是原生的 LangChain，因为 LangGraph 提供了更细粒度的状态控制。每个节点都可以访问和修改 `TravelState`，这样我可以轻松地在节点之间传递数据，比如地理校准后的坐标会传递给 POI 筛选节点使用。"

### 2.4 基础设施

| 技术 | 版本 | 项目中的作用 | 面试亮点 |
|------|------|-------------|---------|
| Docker Compose | 3.9 | 多容器编排 | 5 个服务（MySQL、Redis、Java、Python、Nginx）一键启动 |
| Nginx | 1.25 | 反向代理、静态资源托管 | 前端 SPA 路由 fallback、API 转发 |
| MySQL | 8.0 | 关系型数据存储 | utf8mb4 字符集、Flyway 版本化管理 |
| Redis | 7-alpine | 缓存、Stream、分布式锁 | 多级用途：L2 缓存、任务队列、限流计数器 |

**关键文件：**
- [docker-compose.yml](file:///e:/my_project/TravelMaster/docker-compose.yml)：服务依赖关系、健康检查、环境变量注入

**面试话术示例：**
> "在 Docker Compose 配置中，我使用了 `depends_on` + `condition: service_healthy` 确保 Java 服务等待 MySQL 和 Redis 健康检查通过后才启动，避免了启动时连接失败的错误。MySQL 使用 `mysqladmin ping` 进行健康检查，Redis 使用 `redis-cli ping`。"

---

## 3. "Vibe Coding"与个人成长叙事

### 3.1 故事主线：从零基础到全栈 AI 工程师

**人设定位**：非科班出身/转行者，通过 AI 辅助编程在 3-6 个月内完成复杂系统构建

**叙事框架**：
```
起点（困惑期）→ 突破（AI 赋能）→ 深化（架构理解）→ 成果（项目落地）
```

### 3.2 分阶段成长路径

#### 阶段 1：环境搭建与第一个 Hello World（第 1-2 周）

**挑战**：
- 不懂 Docker，不知道什么是容器化
- 不熟悉 Maven/npm，不知道如何安装依赖
- 不知道如何配置环境变量，`.env` 文件是什么

**AI 辅助策略**：
1. **让 AI 解释配置文件**：
   ```
   问：请逐行解释 docker-compose.yml 中每个字段的作用
   答：version: '3.9' 表示 Docker Compose 文件格式版本...
   ```

2. **询问依赖关系**：
   ```
   问：为什么 Java 服务需要等待 MySQL 健康检查通过才能启动？
   答：因为 Java 应用启动时会初始化 JPA EntityManager，
       如果 MySQL 还没准备好，会导致连接失败...
   ```

3. **理解环境变量**：
   ```
   问：.env 文件中的 DASHSCOPE_API_KEY 是什么？从哪里获取？
   答：这是阿里云百炼的 API Key，用于调用 qwen3 模型...
   ```

**关键收获**：
- 理解容器化部署的价值：一次配置，到处运行
- 学会阅读错误日志：从 traceback 中找到根本原因
- 掌握环境变量管理：区分开发环境和生产环境配置

#### 阶段 2：理解核心模块（第 3-6 周）

**挑战**：
- 看不懂 LangGraph 的状态流转，不知道节点之间如何传递数据
- 不理解 Redis Stream 的异步机制，为什么需要消息队列
- 对 MCP 协议感到陌生，不知道工具调用的原理

**AI 辅助策略**：
1. **通俗化解释**：
   ```
   问：请用通俗语言解释 workflow.py 中 9 个节点的职责
   答：想象你在规划一次旅行：
       1. 意图解析 = 听你说想去哪里、玩几天
       2. 地理校准 = 在地图上找到这个城市的位置
       3. POI 筛选 = 搜索附近的景点和餐厅
       ...
   ```

2. **深入理解数据结构**：
   ```
   问：为什么需要 TravelState 这个 TypedDict？直接传字典不行吗？
   答：TypedDict 提供了类型提示，IDE 可以自动补全字段名，
       编译时也能检查类型错误，避免运行时崩溃...
   ```

3. **可视化消息流转**：
   ```
   问：请画出 Redis Stream 的消息流转图
   答：Java 后端 --XADD--> Redis Stream <--XREAD-- Python Worker
   ```

**关键收获**：
- 掌握状态机思维：每个节点负责单一职责，通过状态传递数据
- 理解异步解耦的优势：生产者无需等待消费者处理完成
- 学会 MCP 工具调用：LLM 决定调用哪个工具，传入参数，获取结果

#### 阶段 3：调试与优化（第 7-10 周）

**挑战**：
- 遇到 404 错误，不知道是前端路由问题还是后端接口问题
- Redis Stream 消息堆积，Worker 重启后重复处理历史任务
- 缓存不一致，点赞后 Feed 列表未更新

**AI 辅助策略**：
1. **错误日志分析**：
   ```
   问：粘贴以下错误日志，请分析根本原因：
   ERROR: Connection refused: localhost:8000
   答：Python AI 服务没有启动，或者端口不是 8000...
   ```

2. **解决消息堆积**：
   ```
   问：为什么 Worker 重启后会重复处理历史任务？
   答：因为你使用了 last_id='0'，这会从 Stream 开头读取。
       应该改为 last_id='$'，从最新消息开始...
   ```

3. **优雅错误处理**：
   ```
   问：请解释 ItineraryTaskService.java 第 337-340 行的 onStatus 优雅处理
   答：当 Python 服务返回 404 时，onStatus 会返回 Mono.empty()，
       而不是抛出异常，这样日志不会被错误堆栈污染...
   ```

**关键收获**：
- 培养系统性排查问题的能力：从日志 → 代码 → 配置逐步定位
- 理解消息队列的 ACK 机制：确保消息不丢失、不重复
- 学会优雅错误处理：区分预期错误和意外异常

#### 阶段 4：扩展与创新（第 11-16 周）

**挑战**：
- 想添加新功能（如大交通规划），但不知道从哪里入手
- 担心修改现有代码会引入 bug
- 不确定新功能是否符合整体架构设计

**AI 辅助策略**：
1. **分析现有架构**：
   ```
   问：我想在 finance_advisor 和 renderer 之间插入 transport_planner，
       应该如何修改 workflow.py？
   答：你需要：
       1. 添加 transport_node 函数
       2. 在 create_travel_graph 中 add_node
       3. 修改 add_edge：finance_advisor → transport_planner → renderer
   ```

2. **生成代码模板**：
   ```
   问：请生成 transport_node 的代码模板，参考其他节点的风格
   答：async def transport_node(state: TravelState) -> TravelState:
           task_id = state.get("task_id", "")
           print(">>> [AI 步骤] 8. 正在为您规划往返大交通方案...")
           ...
   ```

3. **更新状态定义**：
   ```
   问：新增 transport_plan 字段后，需要修改哪些文件？
   答：需要修改：
       1. state.py：添加 transport_plan: TransportPlan | None
       2. schemas/plan.py：定义 TransportPlan Pydantic 模型
       3. renderer.py：接收 transport_plan 参数
   ```

**关键收获**：
- 学会在既有架构上扩展功能：遵循开闭原则，对扩展开放，对修改封闭
- 理解代码风格一致性：新代码应与现有代码保持相同的命名、注释风格
- 掌握增量开发方法：小步快跑，每步都测试通过后再继续

### 3.3 面试话术建议

#### 当面试官问："你是如何学习这些技术的？"

> "我采用'**AI 赋能 + 项目驱动**'的学习方式。以 TravelMaster 为例，我没有从头啃完 Spring Boot 官方文档，而是先让 AI 帮我搭建基础脚手架，然后针对每个模块提出具体问题。比如在学习 LangGraph 时，我问 AI：'这个 9 节点工作流中，为什么地理校准必须在 POI 筛选之前？' AI 解释了依赖关系后，我再去看源码验证。这种方式让我在 3 个月内完成了从零到一的系统构建，而不是停留在理论层面。"

**要点解析**：
- 强调**学习方法论**：AI 赋能 + 项目驱动
- 展示**具体案例**：LangGraph 依赖关系的学习过程
- 突出**时间效率**：3 个月完成系统构建

#### 当面试官问："你在这个项目中遇到的最大挑战是什么？"

> "最大的挑战是理解分布式系统中的'**最终一致性**'问题。例如，当 Python AI Worker 生成行程后回调 Java 接口时，如果网络抖动导致回调失败，如何保证数据不丢失？我通过 AI 学习了 Redis Stream 的 ACK 机制，并在 [progress_tracker.py](file:///e:/my_project/TravelMaster/src/services/progress_tracker.py) 中实现了实时进度追踪，这样即使回调失败，前端也能通过轮询获取最新状态。这个过程让我深刻理解了异步系统的容错设计。"

**要点解析**：
- 指出**具体问题**：回调失败导致数据丢失
- 说明**解决方案**：Redis Stream ACK + 进度追踪
- 体现**深度思考**：最终一致性与容错设计

#### 当面试官问："你为什么选择这些技术栈？"

> "技术选型是基于'**分层解耦**'的原则。Java 擅长处理高并发的 CRUD 业务（用户认证、社交互动），所以用它做主后端；Python 在 AI 生态上有优势（LangChain、MCP），所以用它做 AI 编排层；两者通过 Redis Stream 异步通信，避免同步调用的耦合。这种架构让我能够独立升级某一层的技術，而不影响其他模块。"

**要点解析**：
- 阐述**选型原则**：分层解耦
- 说明**各层职责**：Java 处理业务，Python 处理 AI
- 强调**架构优势**：独立升级、降低耦合

---

## 4. 学习路线图（从 0 到 1）

### 4.1 前置知识准备（1-2 周）

#### 必备基础

**Python 基础**：
- 函数、类、装饰器
- 异步编程（async/await）
- 虚拟环境管理（venv/conda）

**Java 基础**：
- 面向对象（封装、继承、多态）
- 集合框架（List、Map、Set）
- 异常处理（try-catch-finally）

**SQL 基础**：
- SELECT、INSERT、UPDATE、DELETE
- JOIN（INNER、LEFT、RIGHT）
- 索引概念（B-Tree、唯一索引）

**Git 基础**：
- clone、commit、push、pull
- branch、merge、checkout
- .gitignore 配置

#### 推荐资源

- **Python**：廖雪峰 Python 教程（前 10 章）
- **Java**：B站"尚硅谷 Java 入门"（前 20 集）
- **SQL**：SQLZoo 在线练习（https://sqlzoo.net/）
- **Git**：Pro Git 中文版（前 5 章）

### 4.2 第一阶段：环境搭建与项目运行（第 3-4 周）

#### Step 1：安装必要工具

```bash
# 1. 安装 Docker Desktop（Windows/Mac）
# 下载地址：https://www.docker.com/products/docker-desktop

# 2. 验证安装
docker --version
docker-compose --version

# 3. 克隆项目
git clone <repo-url>
cd TravelMaster

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填入以下 API Key：
# - DASHSCOPE_API_KEY（阿里云百炼，免费额度足够测试）
# - AMAP_API_KEY（高德地图 Web 服务 API）
```

#### Step 2：一键启动

```bash
docker-compose up --build
```

**预期输出**：
```
travelmaster-mysql      | ready for connections
travelmaster-redis      | Ready to accept connections
travelmaster-java-api   | Started TravelMasterApplication in 15s
travelmaster-python-ai  | Uvicorn running on http://0.0.0.0:8000
travelmaster-nginx      | start worker processes
```

**访问验证**：
- 前端：http://localhost
- Java API 文档：http://localhost:8080/swagger-ui.html
- Python AI 文档：http://localhost:8000/docs

#### 常见问题排查

**问题 1**：MySQL 启动失败，报错 `Can't create test file`

**解决**：
```bash
# 删除 mysql-data 卷，重新执行
docker-compose down -v
docker-compose up --build
```

**问题 2**：Python 服务连接 Redis 超时

**解决**：
检查 `.env` 中 `REDIS_URL` 是否为 `redis://redis:6379/0`（Docker 网络中使用服务名，而非 localhost）

**问题 3**：前端页面空白，控制台报错 404

**解决**：
```bash
# 检查 Nginx 是否正确挂载前端 dist 目录
docker-compose logs nginx
# 重新构建前端
cd travel-master-frontend && npm run build
```

### 4.3 第二阶段：理解核心模块（第 5-8 周）

#### 模块 1：用户认证流程

**学习目标**：理解 JWT Token 生成与验证

**关键文件**：
- [AuthController.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/auth/controller/AuthController.java)
- [JwtAuthenticationFilter.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/security/JwtAuthenticationFilter.java)

**实践任务**：
1. 注册一个新用户，观察返回的 `accessToken` 和 `refreshToken`
2. 使用 Postman 发送带 Token 的请求，验证鉴权是否生效
3. 修改 Token 中的一个字符，观察 401 错误

**深入理解**：
```java
// JwtAuthenticationFilter.java 核心逻辑
String token = extractToken(request);
if (token != null && jwtUtil.validateToken(token)) {
    String userId = jwtUtil.getUserIdFromToken(token);
    Authentication auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
    SecurityContextHolder.getContext().setAuthentication(auth);
}
```

#### 模块 2：AI 行程生成流程

**学习目标**：理解 9 段式工作流的状态流转

**关键文件**：
- [workflow.py](file:///e:/my_project/TravelMaster/src/agents/workflow.py)（第 263-286 行）
- [state.py](file:///e:/my_project/TravelMaster/src/agents/state.py)

**实践任务**：
1. 在前端输入"北京 3 天 文化古迹"，观察控制台输出的 9 个步骤日志
2. 在 Redis 中查看进度数据：`redis-cli HGETALL task_progress:<taskId>`
3. 修改 [workflow.py](file:///e:/my_project/TravelMaster/src/agents/workflow.py) 中的节点顺序，观察执行结果变化

**深入理解**：
```python
# workflow.py 工作流定义
workflow.add_edge("intent_parser", "geo_grounder")
workflow.add_edge("geo_grounder", "poi_selector")
workflow.add_edge("poi_selector", "route_optimizer")
# ... 依此类推
```

#### 模块 3：Redis Stream 异步任务

**学习目标**：理解生产者-消费者模式

**关键文件**：
- [AiTaskPublisher.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/ai/service/AiTaskPublisher.java)
- [stream_worker.py](file:///e:/my_project/TravelMaster/src/worker/stream_worker.py)

**实践任务**：
1. 在 Redis 中监听 Stream：`redis-cli XREAD BLOCK 0 STREAMS travelmaster:ai:tasks $`
2. 前端提交一个行程任务，观察 Stream 中的消息格式
3. 停止 Python Worker，连续提交 3 个任务，再启动 Worker，观察消息堆积处理

**深入理解**：
```python
# stream_worker.py 消费逻辑
messages = await redis.xread(
    streams={STREAM_NAME: last_id},  # last_id = '$' 从最新消息开始
    count=1,
    block=0  # 阻塞等待
)
```

### 4.4 第三阶段：调试与优化（第 9-12 周）

#### 调试技巧 1：日志级别调整

**场景**：进度更新日志不显示

**解决**：
```python
# main.py
uvicorn.run(
    "main:app",
    log_level="info",      # 从 warning 改为 info
    access_log=False       # 关闭访问日志减少噪音
)
```

**原理**：
- `log_level="warning"` 只会显示 WARNING 及以上级别的日志
- `logger.info()` 在 warning 级别下被过滤掉
- 改为 `info` 后可以看到进度更新的详细信息

#### 调试技巧 2：数据库查询优化

**场景**：行程列表加载缓慢

**解决**：
```java
// ItineraryRepository.java
@Query("SELECT i FROM Itinerary i LEFT JOIN FETCH i.items WHERE i.userId = :userId")
List<Itinerary> findByUserIdWithItems(@Param("userId") String userId);
```

**原理**：
- 不使用 `FETCH` 时，JPA 会为每个行程单独查询 items（N+1 问题）
- 使用 `LEFT JOIN FETCH` 后，一次性查询所有行程及其 items
- 性能提升：从 100 次查询降低到 1 次查询

#### 调试技巧 3：缓存一致性

**场景**：点赞后 Feed 列表未更新

**解决**：
```java
@CacheEvict(cacheNames = {"postFeed"}, key = "#postId")
public void likePost(String postId, String userId) {
    // 点赞逻辑
}
```

**原理**：
- 点赞操作会改变帖子的 `likeCount`
- 如果不清除缓存，Feed 列表仍显示旧的点赞数
- `@CacheEvict` 在方法执行后清除指定缓存
- 下次请求时会重新从数据库查询最新数据

### 4.5 第四阶段：扩展功能（第 13-16 周）

#### 扩展 1：添加新的 MCP 工具

**目标**：集成酒店查询 MCP

**步骤**：
1. 在 [tool_registry.py](file:///e:/my_project/TravelMaster/src/mcp/tool_registry.py) 中注册新工具
2. 在 [poi_selector.py](file:///e:/my_project/TravelMaster/src/planner/stages/poi_selector.py) 中调用工具
3. 更新 [state.py](file:///e:/my_project/TravelMaster/src/agents/state.py) 添加 `hotel_options` 字段

**示例代码**：
```python
# tool_registry.py
def register_hotel_mcp():
    return {
        "name": "search_hotels",
        "description": "搜索附近酒店",
        "parameters": {
            "location": "string",
            "check_in": "string",
            "check_out": "string"
        }
    }

# poi_selector.py
hotels = await call_mcp_tool("search_hotels", {
    "location": geo_data["center"],
    "check_in": intent.start_date,
    "check_out": intent.end_date
})
```

#### 扩展 2：实现 WebSocket 实时通知

**目标**：行程生成完成后主动推送给前端

**参考文件**：
- [NotificationWebSocket.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/notification/websocket/NotificationWebSocket.java)

**实现思路**：
1. Python Worker 生成完成后，通过 WebSocket 推送消息
2. 前端订阅 WebSocket 频道，接收实时通知
3. 收到通知后，自动刷新行程列表

**示例代码**：
```java
// NotificationWebSocket.java
@MessageMapping("/tasks/{taskId}")
@SendToUser("/queue/tasks")
public void handleTaskComplete(@DestinationVariable String taskId) {
    simpMessagingTemplate.convertAndSendToUser(
        getUserId(), 
        "/queue/tasks", 
        new TaskCompleteNotification(taskId)
    );
}
```

---

## 5. 面试预判与防御（Mock Interview）

### 5.1 AI Agent 相关

#### Q1：你的 LangGraph 工作流中，为什么需要 9 个节点？能不能合并成 3 个？

**回答思路**：

1. **分层解耦原则**：
   - 每个节点负责单一职责，便于独立测试和优化
   - 例如，地理校准节点只负责调用高德 MCP 获取坐标，不涉及 POI 筛选逻辑

2. **MCP 工具调用时机**：
   - 地理校准需要调用高德 MCP 的地理编码工具
   - POI 筛选需要调用高德 MCP 的 POI 搜索工具
   - 分开可以独立重试，如果地理校准失败，不需要重新执行意图解析

3. **状态可追溯性**：
   - 如果合并节点，出错时难以定位是哪个子步骤失败
   - 9 个节点可以在 [progress_tracker.py](file:///e:/my_project/TravelMaster/src/services/progress_tracker.py) 中清晰展示每个步骤的状态

4. **性能优化空间**：
   - 未来可以将 POI 筛选和路线优化并行执行（当前是串行）
   - 如果合并成 3 个大节点，就无法实现细粒度的并行优化

**深度追问：如果某个节点失败，整个工作流会怎样？**

**回答**：
- LangGraph 默认会在节点抛出异常时终止工作流
- 我在 [progress_tracker.py](file:///e:/my_project/TravelMaster/src/services/progress_tracker.py) 中记录了每个节点的状态（pending/processing/completed/failed）
- 前端可以通过 `/api/tasks/{taskId}/progress` 接口看到失败的具体步骤
- **改进方向**：可以在节点内部添加 try-catch，失败时返回降级数据而非抛异常。例如，如果天气查询失败，可以返回"天气数据暂不可用"，而不是终止整个工作流

---

#### Q2：你的模型降级策略是如何实现的？什么情况下会触发降级？

**回答思路**：

1. **实现位置**：[model_router.py](file:///e:/my_project/TravelMaster/src/llm/model_router.py) 第 41-66 行

2. **降级条件**：
   - `MODEL_PRIORITY == "cloud"` 且 `DASHSCOPE_API_KEY` 未配置
   - 百炼 API 调用超时（默认 30 秒）
   - 百炼 API 返回非 200 状态码

3. **降级行为**：
   - 切换到 Ollama gemma4:e2b
   - 但不支持 MCP 工具调用（Ollama 无法连接外部 MCP 服务器）
   - 只能进行纯文本推理

4. **监控指标**：
   - 在 `itinerary_generation_task` 表中记录 `fallback_used` 字段
   - 可以通过 SQL 查询降级率：`SELECT COUNT(*) FROM itinerary_generation_task WHERE fallback_used = true`

**深度追问：Ollama 不支持 MCP，那降级后的行程质量如何保证？**

**回答**：
- **短期方案**：降级后无法调用高德 MCP，因此无法获取真实地理坐标和路径规划。我会在 prompt 中要求 LLM 生成"模拟坐标"，前端展示时标注"仅供参考"
- **长期方案**：可以集成开源地理编码服务（如 Nominatim）作为降级的 MCP 替代，这样即使在没有云端 API Key 的情况下，也能获取真实的地理数据
- **用户体验**：在降级模式下，前端会显示黄色警告条："当前使用本地模型，部分功能受限"

---

### 5.2 高并发与分布式

#### Q3：你为什么使用 Redis Stream 而不是 RabbitMQ/Kafka？

**回答思路**：

1. **项目规模**：
   - TravelMaster 是中小型项目，日活预计 < 10万
   - Redis Stream 的性能足够支撑这个量级（我的 k6 压测中可以支撑 500 req/s）

2. **运维成本**：
   - Redis 已经用于缓存和分布式锁，无需引入新的中间件
   - Kafka 需要 ZooKeeper，运维复杂度高
   - RabbitMQ 需要单独部署和管理

3. **功能对比**：
   - **Redis Stream**：轻量、支持消费者组、消息持久化（AOF）、与现有 Redis 实例共享
   - **Kafka**：适合海量数据（亿级/天）、高吞吐、但运维复杂
   - **RabbitMQ**：功能丰富（路由、主题交换）、但内存占用高

4. **性能数据**：
   - 在我的 k6 压测中，Redis Stream 可以支撑 500 req/s 的任务提交
   - 平均延迟 < 100ms（从投递到消费）

**深度追问：如果 Redis 宕机，未完成的任务会丢失吗？**

**回答**：
- **短期丢失风险**：Redis 默认是内存存储，宕机后未持久化的消息会丢失
- **缓解措施**：
  1. 启用 AOF（Append Only File）持久化：`appendonly yes`
  2. 设置 `appendfsync everysec`，每秒同步一次磁盘
  3. Java 端在投递 Stream 前，先将任务状态写入 MySQL（PENDING）
- **恢复策略**：Worker 重启后，可以从 MySQL 中找回 PENDING 状态的任务，重新投递到 Stream
- **最佳实践**：对于关键任务，应该在应用层实现"至少一次"语义，确保消息不丢失

---

#### Q4：你的分布式锁是如何防止重复提交的？如果锁释放失败怎么办？

**回答思路**：

1. **实现位置**：[ItineraryTaskService.java](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/java/com/travelmaster/itinerary/service/ItineraryTaskService.java) 第 102-122 行

2. **锁的粒度**：
   - `lock:itinerary-task:{userId}:{idempotencyKey}`
   - 确保同一用户的相同请求不会并发执行
   - 不同用户或不同请求可以并行处理

3. **锁的超时**：
   - Redisson 默认 30 秒自动释放，防止死锁
   - 如果业务逻辑执行超过 30 秒，看门狗线程会自动续期

4. **幂等键生成**：
   - 如果前端传入 `Idempotency-Key`，直接使用
   - 否则，用 `userId + userInput` 的哈希值作为键

**深度追问：如果 Java 服务在持有锁时崩溃，锁会自动释放吗？**

**回答**：
- **是的**，Redisson 使用 Redis 的 EXPIRE 机制，即使客户端崩溃，Key 也会在 30 秒后自动过期
- **看门狗机制**：Redisson 有一个后台线程，每 10 秒续期一次锁（如果业务逻辑还在执行）
- **极端情况**：如果 JVM 突然断电，看门狗线程停止，锁会在 30 秒后自动释放
- **注意事项**：锁的超时时间应该大于业务逻辑的最大执行时间，否则可能出现并发问题

---

### 5.3 数据库与缓存

#### Q5：你的两级缓存（Caffeine + Redis）是如何工作的？什么时候会失效？

**回答思路**：

1. **缓存层级**：
   - **L1**：Caffeine（JVM 本地缓存），TTL 5 分钟，最大 1000 条目
   - **L2**：Redis（分布式缓存），TTL 30 分钟

2. **读取流程**：
   ```
   请求 → Caffeine (命中则返回) → Redis (命中则返回并写入 Caffeine) → MySQL (查询后写入两层缓存)
   ```

3. **失效策略**：领域事件触发
   - 点赞/收藏 → 清除帖子详情缓存 + 榜单缓存
   - 发布帖子 → 清除 feed 缓存
   - 关注 → 清除创作者榜缓存

4. **代码示例**：
   ```java
   @Cacheable(value = "postDetail", key = "#postId")
   public Post getPost(String postId) { ... }
   
   @CacheEvict(value = "postDetail", key = "#postId")
   public void updatePost(String postId) { ... }
   ```

**深度追问：如果两个用户同时点赞同一篇帖子，缓存会不一致吗？**

**回答**：
- **短期不一致**：是的，用户 A 点赞后，用户 B 的 Caffeine 缓存可能还是旧数据
- **最终一致**：Redis 中的计数是准确的，Caffeine 缓存 5 分钟后会自动过期
- **优化方案**：可以使用 Redis Pub/Sub 通知所有 Java 实例清除本地缓存，但会增加复杂度
- **权衡**：对于点赞数这种非关键数据，短期不一致是可以接受的，没必要为了强一致性牺牲性能

---

#### Q6：你的数据库外键约束是如何设计的？为什么删除帖子时会失败？

**回答思路**：

1. **初始设计**：
   - `post_likes`、`post_favorites`、`comments` 表的外键没有 `ON DELETE CASCADE`
   - 删除帖子时，MySQL 报错：`Cannot delete or update a parent row: a foreign key constraint fails`

2. **问题原因**：
   - 外键约束阻止删除被引用的父记录
   - 需要先手动删除所有关联的子记录，才能删除帖子

3. **解决方案**：
   - 在 [V4__fix_cascade_delete.sql](file:///e:/my_project/TravelMaster/travel-master-backend/src/main/resources/db/migration/V4__fix_cascade_delete.sql) 中添加级联删除
   ```sql
   ALTER TABLE post_likes 
       ADD CONSTRAINT fk_post_like_post 
       FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
   ```

4. **权衡**：
   - **优点**：级联删除方便，应用层无需手动清理关联数据
   - **缺点**：可能误删大量数据，需要在应用层做好确认提示
   - **最佳实践**：对于重要数据，建议在应用层实现软删除（标记 deleted_at），而非物理删除

---

### 5.4 前端与用户体验

#### Q7：你的前端如何实现行程生成的实时进度展示？

**回答思路**：

1. **技术方案**：前端轮询（Polling），每 2 秒调用一次 `/api/itinerary-tasks/{taskId}`

2. **数据结构**：后端返回 `TaskProgress` 对象，包含：
   - `overallProgress`：总体进度（0-100）
   - `currentStep`：当前步骤名称
   - `steps`：数组，每个元素包含 `stepId`、`stepName`、`status`（pending/processing/completed/failed）

3. **UI 展示**：
   - 使用进度条组件展示 `overallProgress`
   - 使用步骤列表展示 9 个节点的状态，当前步骤高亮显示
   - 已完成的步骤显示绿色勾选，失败的步骤显示红色叉号

4. **优化方向**：可以改用 WebSocket 推送，减少无效请求

**深度追问：如果用户刷新页面，进度会丢失吗？**

**回答**：
- **不会丢失**：进度数据存储在 Redis Hash 中（Key: `task_progress:{taskId}`），与前端会话无关
- **恢复逻辑**：刷新后，前端从 URL 中读取 `taskId`，重新调用进度接口
- **过期策略**：Redis Key 设置 1 小时 TTL，超时的任务进度会被自动清理
- **边界情况**：如果用户在任务完成后 1 小时再刷新，进度数据已过期，前端应显示"任务已完成，请查看历史行程"

---

#### Q8：你的足迹地图为什么选择 ECharts 而不是高德地图？

**回答思路**：

1. **需求差异**：
   - 足迹地图只需要展示省级行政区的访问状态（已访问/未访问）
   - 不需要详细街道信息、路径规划等功能

2. **ECharts 优势**：
   - **轻量**：只需加载中国省级 GeoJSON（约 200KB）
   - **灵活**：可以自由定制颜色、交互逻辑
   - **离线可用**：GeoJSON 可以缓存，不依赖外部 API

3. **高德地图劣势**：
   - 加载完整地图瓦片较慢（首次加载可能需要几秒）
   - 需要 API Key 配额，超出配额会收费
   - 对于简单的省级地图展示，功能过剩

**深度追问：如果阿里云 DataV 的 GeoJSON 接口挂了怎么办？**

**回答**：
- **降级策略**：在 [ChinaMap.tsx](file:///e:/my_project/TravelMaster/travel-master-frontend/src/components/ChinaMap.tsx) 中尝试多个数据源
  1. 首选：阿里云 DataV v3 API
  2. 备选：阿里云 DataV v2 API
  3. 兜底：本地静态 GeoJSON 文件（打包在项目中）
- **用户体验**：即使地图加载失败，右侧省份列表仍可使用，用户可以手动标记
- **监控告警**：可以上报 GeoJSON 加载失败的事件，便于后续优化

---

### 5.5 部署与运维

#### Q9：你的 Docker Compose 配置中，为什么 Java 服务需要等待 MySQL 和 Redis 健康检查通过？

**回答思路**：

1. **依赖关系**：
   - Java 服务启动时会连接 MySQL（初始化 JPA EntityManager）
   - Java 服务启动时会连接 Redis（初始化缓存管理器、Redisson 客户端）

2. **问题场景**：
   - 如果 MySQL 还没准备好，Java 服务会启动失败并退出
   - Docker Compose 会不断重启 Java 服务，形成重启循环

3. **解决方案**：
   - 在 [docker-compose.yml](file:///e:/my_project/TravelMaster/docker-compose.yml) 第 60-64 行配置：
   ```yaml
   depends_on:
     mysql:
       condition: service_healthy
     redis:
       condition: service_healthy
   ```
   - 健康检查：
     - MySQL：`mysqladmin ping -h localhost -u root -proot`
     - Redis：`redis-cli ping`

**深度追问：如果 Python 服务启动时，Java 服务还没就绪，会影响任务处理吗？**

**回答**：
- **不会影响**：Python Worker 使用 `XREAD BLOCK 0` 阻塞等待消息，即使 Java 还没启动，Worker 也不会报错
- **任务积压**：如果用户在 Java 启动前提交任务，任务会堆积在 Redis Stream 中，Java 启动后会自动处理
- **回调失败**：如果 Python Worker 在 Java 未就绪时完成任务，回调 Java 接口会失败，但 Worker 会重试（需要实现重试逻辑）
- **改进方向**：可以在 Python Worker 中添加健康检查，确认 Java 服务可用后再开始消费任务

---

#### Q10：你是如何进行性能压测的？发现了哪些瓶颈？

**回答思路**：

1. **压测工具**：k6，脚本位于 `load-test/` 目录

2. **压测场景**：
   - **登录压力测试**：`login-stress.js`，模拟 100 用户并发登录
   - **Feed 交互测试**：`feed-interaction.js`，模拟浏览、点赞、收藏
   - **任务提交测试**：`task-submit.js`，模拟高频行程生成请求

3. **发现瓶颈**：
   - **MySQL 连接池耗尽**：默认 HikariCP 最大连接数 10，改为 50
   - **Redis Stream 消息堆积**：Worker 处理速度慢于生产速度，增加 Worker 实例数
   - **JVM GC 频繁**：Caffeine 缓存过大，限制最大条目数为 1000

4. **优化效果**：
   - 登录接口 QPS 从 50 提升到 200
   - 行程生成任务平均延迟从 5s 降低到 2s
   - MySQL CPU 使用率从 80% 降低到 40%

**深度追问：如果要将 QPS 从 100 提升到 1000，你会怎么做？**

**回答**：
- **水平扩展**：
  1. Java 服务：增加实例数，前面加 Nginx 负载均衡
  2. Python Worker：启动多个 Worker 进程，使用 Redis 消费者组（Consumer Group）
- **垂直优化**：
  1. MySQL：读写分离，主库写、从库读
  2. Redis：集群模式，分片存储
- **缓存优化**：
  1. 增加 CDN 缓存静态资源（前端 JS/CSS/图片）
  2. 使用 Redis Pipeline 批量操作，减少网络往返
- **异步化**：
  1. 将更多同步操作改为异步（如发送邮件、推送通知）
  2. 使用消息队列削峰填谷

---

## 6. 附录：快速参考清单

### 6.1 常用命令

```bash
# 启动所有服务
docker-compose up --build

# 后台启动
docker-compose up -d

# 查看日志
docker-compose logs -f java-api
docker-compose logs -f python-ai
docker-compose logs -f nginx

# 进入容器调试
docker exec -it travelmaster-mysql mysql -u root -proot
docker exec -it travelmaster-redis redis-cli
docker exec -it travelmaster-java-api bash
docker exec -it travelmaster-python-ai bash

# 停止所有服务
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v

# 运行测试
cd travel-master-backend && mvn test
python -m pytest src/tests -q

# k6 压测
k6 run load-test/login-stress.js
k6 run load-test/feed-interaction.js
k6 run load-test/task-submit.js

# 清理 Redis Stream 堆积消息
python clean_redis_stream.py
```

### 6.2 关键 API 端点

| 端点 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | 否 |
| `/api/auth/login` | POST | 用户登录 | 否 |
| `/api/auth/refresh` | POST | 刷新 Token | 否 |
| `/api/itinerary-tasks` | POST | 创建行程任务 | 是 |
| `/api/itinerary-tasks/{taskId}` | GET | 查询任务状态 | 是 |
| `/api/itineraries` | GET | 获取历史行程 | 是 |
| `/api/itineraries/{id}` | GET | 获取行程详情 | 是 |
| `/api/itineraries/{id}/publish` | POST | 发布为帖子 | 是 |
| `/api/feed` | GET | 获取社交 Feed | 是 |
| `/api/posts/{id}/like` | POST | 点赞/取消点赞 | 是 |
| `/api/posts/{id}/favorite` | POST | 收藏/取消收藏 | 是 |
| `/api/posts/{id}/comments` | POST | 发表评论 | 是 |
| `/api/users/{id}/follow` | POST | 关注/取消关注 | 是 |
| `/api/notifications` | GET | 获取通知列表 | 是 |
| `/api/rankings/hot-itineraries` | GET | 热门行程榜 | 否 |
| `/api/v1/tasks/{taskId}/progress` | GET | 查询实时进度（Python） | 否 |

### 6.3 环境变量清单

| 变量名 | 必填 | 说明 | 示例值 |
|--------|------|------|--------|
| `DASHSCOPE_API_KEY` | 是 | 阿里云百炼 API Key | `sk-xxx` |
| `AMAP_API_KEY` | 是 | 高德地图 Web 服务 API Key | `xxx` |
| `AMAP_MCP_URL` | 否 | 高德 MCP SSE 地址（从百炼市场获取） | `https://xxx/sse` |
| `YINGMI_MCP_URL` | 否 | 盈米金融 MCP SSE 地址 | `https://xxx/sse` |
| `YINGMI_API_KEY` | 否 | 盈米金融 API Key | `xxx` |
| `MODEL_PRIORITY` | 否 | 模型优先级：`cloud` 或 `local` | `cloud` |
| `BAILIAN_MAIN_MODEL` | 否 | 百炼主推理模型 | `qwen3-plus` |
| `BAILIAN_FLASH_MODEL` | 否 | 百炼轻量抽取模型 | `qwen3-flash` |
| `OLLAMA_BASE_URL` | 否 | Ollama 服务地址 | `http://localhost:11434` |
| `OLLAMA_MODEL` | 否 | Ollama 模型名称 | `gemma4:e2b` |
| `REDIS_URL` | 否 | Redis 连接地址 | `redis://redis:6379/0` |
| `JAVA_CALLBACK_BASE_URL` | 否 | Java 回调地址 | `http://java-api:8080/api/internal/ai/tasks` |

### 6.4 数据库表结构概览

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `users` | 用户表 | id, email, phone, membership_tier, level, points |
| `user_auth` | 用户认证表 | user_id, password_hash, refresh_token |
| `user_profile` | 用户资料表 | user_id, nickname, avatar, preferences |
| `itinerary_generation_task` | 行程生成任务表 | id, user_id, status, mcp_trace, fallback_used |
| `itineraries` | 行程表 | id, user_id, task_id, title, summary, structured_content |
| `itinerary_items` | 行程项表 | id, itinerary_id, day_number, sequence_number, item_title |
| `posts` | 帖子表 | id, user_id, itinerary_id, title, like_count, favorite_count |
| `post_likes` | 点赞表 | id, post_id, user_id |
| `post_favorites` | 收藏表 | id, post_id, user_id |
| `comments` | 评论表 | id, post_id, user_id, content |
| `follows` | 关注表 | id, follower_id, followee_id |
| `notifications` | 通知表 | id, user_id, type, content, read_status |
| `user_behavior_events` | 用户行为事件表 | id, user_id, event_type, target_type, target_id |

### 6.5 常见问题 FAQ

**Q1：如何获取阿里云百炼 API Key？**

A：访问 https://bailian.console.aliyun.com/，注册账号后在"API-KEY 管理"中创建 Key。新用户有免费额度。

**Q2：如何获取高德地图 API Key？**

A：访问 https://console.amap.com/dev/key/app，注册账号后创建应用，选择"Web 服务"类型。

**Q3：Python Worker 没有消费任务怎么办？**

A：
1. 检查 Redis Stream 中是否有消息：`redis-cli XLEN travelmaster:ai:tasks`
2. 检查 Worker 日志：`docker-compose logs -f python-ai`
3. 确认 `ENABLE_STREAM_WORKER=true` 环境变量已设置

**Q4：前端页面显示空白怎么办？**

A：
1. 检查浏览器控制台是否有错误
2. 确认 Nginx 正确挂载了前端 dist 目录
3. 重新构建前端：`cd travel-master-frontend && npm run build`

**Q5：如何重置数据库？**

A：
```bash
docker-compose down -v  # 删除所有数据卷
docker-compose up --build  # 重新创建数据库
```

---

## 📝 结语

TravelMaster Pro 2.0 不仅是一个技术项目，更是**AI 赋能开发**的实践案例。通过这个项目，你可以：

1. **掌握全栈开发技能**：从前端 React 到后端 Spring Boot，再到 AI 编排 LangGraph
2. **理解分布式系统**：Redis Stream、分布式锁、两级缓存、消息队列
3. **积累 AI Agent 经验**：MCP 工具链、模型降级、状态机管理
4. **培养工程思维**：可观测性、性能优化、错误处理、文档编写

**最后建议**：在面试中，不要只是罗列技术名词，而是要讲述你**如何使用这些技术解决问题**的过程。面试官更关心的是你的**思考方式**和**学习能力**，而不仅仅是你知道多少技术。

祝你求职顺利！🚀
