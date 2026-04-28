# TravelMaster Pro

> 基于 **Java Spring Boot + Python FastAPI + LangGraph** 的智能旅游社交平台。  
> 定位：高并发旅游社交平台 —— Java 主业务后端 + Python AI 行程规划服务。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| **Java 后端** | Spring Boot 3.2 · Spring Security · Spring Data JPA · Flyway · WebSocket (STOMP) |
| **Python AI** | FastAPI · LangGraph · LangChain · Ollama / DeepSeek · Pydantic |
| **数据** | MySQL 8.0 · Redis 7 (Stream / Cache / Rate Limit / Distributed Lock) |
| **缓存** | Caffeine (L1) + Redis (L2) 两级缓存 |
| **分布式** | Redisson 分布式锁 · Redis Stream 异步任务 |
| **前端** | React 19 · TypeScript · Vite · TailwindCSS · Axios |
| **基础设施** | Docker Compose · Nginx · k6 压测 |
| **测试** | JUnit 5 · Mockito · MockMvc · pytest · pytest-asyncio |

---

## 架构概览

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Nginx   │────▶│  Java API    │────▶│    MySQL     │
│ (80)     │     │ (8080)       │     │  (3306)      │
└──────────┘     └──────┬───────┘     └──────────────┘
     │                  │
     │            ┌─────▼─────┐
     │            │   Redis   │◀─── Stream / Cache / Lock
     │            │  (6379)   │
     │            └─────┬─────┘
     │                  │  Redis Stream
     │            ┌─────▼─────┐
     └───────────▶│ Python AI │
                  │ (8000)    │
                  └───────────┘
```

**数据流**：
1. 用户通过 Nginx 访问前端 SPA 或调用 `/api/*` 接口
2. Java 后端处理认证、社交、通知等核心业务，数据写入 MySQL
3. 行程生成请求：Java 写入 `itinerary_generation_task` 表，投递 Redis Stream
4. Python AI Worker 从 Redis Stream 消费任务，调用 LangGraph 工作流生成结构化行程
5. 生成完成后 Python 回调 Java 内部接口，Java 落库并推送 WebSocket 通知
6. 前端通过轮询或 WebSocket 获取结果

---

## 核心模块

| 模块 | 职责 | 关键技术点 |
|------|------|-----------|
| `auth` | 注册/登录/刷新 Token | JWT · BCrypt · Redis 限流 · Refresh Token 轮转 |
| `user` | 用户资料管理 | JPA · 偏好标签 |
| `itinerary` | 行程生成任务 | Redis Stream · 幂等键 · Redisson 分布式锁 · 异步回调 |
| `social` | 帖子/点赞/收藏/评论/关注 | MySQL 写 + Redis 热计数 · 领域事件触发缓存失效 |
| `notification` | 通知系统 | WebSocket (STOMP) · Redis Stream |
| `ranking` | 排行榜 | Redis Sorted Set · Caffeine + Redis 两级缓存 |
| `analytics` | 运营报表 | 聚合 SQL · 转化漏斗 · 目的地统计 |
| `ai-planner` | AI 行程规划 (Python) | LangGraph · 结构化输出 · 7 个 Skill 并发 fan-out |

---

## 快速开始

### 环境要求

- Docker Desktop（含 Docker Compose）
- 可选：JDK 21 + Maven 3.9（本地开发）
- 可选：Python 3.12+（本地开发）
- 可选：Node.js 20+（前端开发）

### 一键启动

```bash
# 克隆项目
git clone <repo-url> && cd TravelMaster

# 配置环境变量（按需修改 .env）
cp .env.example .env

# 启动所有服务
docker-compose up --build

# 访问
# 前端:  http://localhost
# API:   http://localhost/api
# AI:    http://localhost/ai/docs
```

### 本地开发

```bash
# 1. 启动依赖
docker-compose up mysql redis -d

# 2. Java 后端
cd travel-master-backend
mvn spring-boot:run

# 3. Python AI
cd ..
pip install -r requirements.txt
python main.py

# 4. 前端
cd travel-master-frontend
npm install && npm run dev
```

---

## API 列表

### 认证
| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新 Token |

### 用户
| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/users/me` | 获取当前用户资料 |
| PUT | `/api/users/me` | 更新当前用户资料 |

### 行程任务
| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/itinerary-tasks` | 创建 AI 行程生成任务 |
| GET | `/api/itinerary-tasks/{taskId}` | 查询任务状态与结果 |

### 社交
| Method | Path | 说明 |
|--------|------|------|
| POST | `/api/itineraries/{id}/publish` | 发布行程为帖子 |
| GET | `/api/feed` | 获取社交 Feed |
| POST | `/api/posts/{id}/like` | 点赞/取消点赞 |
| POST | `/api/posts/{id}/favorite` | 收藏/取消收藏 |
| POST | `/api/posts/{id}/comments` | 发表评论 |
| POST | `/api/users/{id}/follow` | 关注/取消关注 |

### 通知
| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/notifications` | 获取通知列表 |
| POST | `/api/notifications/{id}/read` | 标记已读 |

### 排行榜 & 分析
| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/rankings/hot-itineraries` | 热门行程榜 |
| GET | `/api/rankings/creators` | 优质创作者榜 |
| GET | `/api/analytics/overview` | 运营概览 |
| GET | `/api/analytics/funnel` | 转化漏斗 |
| GET | `/api/analytics/destinations` | 热门目的地 |

---

## 测试

```bash
# Java 单元测试 + 集成测试
cd travel-master-backend && mvn test

# Python 测试
python -m pytest src/tests -q

# k6 压测（需安装 k6）
k6 run load-test/login-stress.js
k6 run load-test/feed-interaction.js
k6 run load-test/task-submit.js
```

---

## 项目结构

```
TravelMaster/
├── travel-master-backend/       # Java Spring Boot 主后端
│   ├── src/main/java/com/travelmaster/
│   │   ├── auth/                # 认证模块
│   │   ├── user/                # 用户模块
│   │   ├── itinerary/           # 行程任务模块
│   │   ├── social/              # 社交模块 (帖子/点赞/收藏/评论/关注)
│   │   ├── notification/        # 通知模块
│   │   ├── ranking/             # 排行榜模块
│   │   ├── analytics/           # 运营分析模块
│   │   ├── ai/                  # AI 任务发布 (Redis Stream)
│   │   ├── security/            # JWT 认证过滤器
│   │   ├── config/              # 全局配置 (Security/Redis/WebSocket/Cache)
│   │   ├── common/              # 公共基础 (BaseEntity/ApiResponse/Exception)
│   │   └── compat/              # 旧接口兼容层
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/        # Flyway DDL
├── src/                         # Python AI 规划服务
│   ├── agents/                  # LangGraph 工作流
│   ├── skills/                  # 7 个独立 Skill
│   ├── schemas/                 # Pydantic 结构化输出
│   ├── services/                # TravelService
│   ├── worker/                  # Redis Stream Worker
│   └── tests/                   # Python 测试
├── travel-master-frontend/      # React + TypeScript 前端
├── config/nginx/                # Nginx 配置
├── load-test/                   # k6 压测脚本
├── docs/                        # 文档 (SQL Showcase 等)
├── docker-compose.yml
└── ARCHITECTURE.md              # 架构设计文档
```

---

## License

MIT
