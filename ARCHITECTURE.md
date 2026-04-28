# TravelMaster Pro — 架构设计文档

## 1. 分层架构

```mermaid
graph TB
    subgraph Client["客户端"]
        Browser["浏览器 / SPA"]
    end

    subgraph Gateway["网关层"]
        Nginx["Nginx<br/>反向代理 / 静态托管"]
    end

    subgraph JavaBackend["Java 主业务后端 (Spring Boot)"]
        direction TB
        Controller["Controller 层<br/>REST API + WebSocket"]
        Service["Service 层<br/>业务逻辑 + 领域事件"]
        Repository["Repository 层<br/>JPA + 手写 SQL"]
        Security["Security<br/>JWT Filter + Rate Limit"]
    end

    subgraph PythonAI["Python AI 规划服务 (FastAPI)"]
        direction TB
        StreamWorker["Redis Stream Worker<br/>消费任务"]
        LangGraphWF["LangGraph 工作流<br/>并发 fan-out"]
        Skills["Skill 层<br/>7 个独立技能模块"]
    end

    subgraph DataLayer["数据层"]
        MySQL["MySQL 8.0<br/>业务真相"]
        Redis["Redis 7<br/>Stream / Cache / Lock / Rate Limit"]
    end

    Browser -->|HTTP/WS| Nginx
    Nginx -->|/api/*| Controller
    Nginx -->|/ws| Controller
    Nginx -->|/ai/*| StreamWorker
    Controller --> Security
    Security --> Service
    Service --> Repository
    Repository --> MySQL
    Service -->|"投递 Stream<br/>缓存读写<br/>分布式锁<br/>限流"| Redis
    Redis -->|"Stream 消费"| StreamWorker
    StreamWorker --> LangGraphWF
    LangGraphWF --> Skills
    StreamWorker -->|"回调 /api/internal"| Controller
```

---

## 2. ER 图

```mermaid
erDiagram
    users ||--o| user_profile : "1:1"
    users ||--o| user_auth : "1:1"
    users ||--o{ itinerary_generation_task : "1:N"
    users ||--o{ itineraries : "1:N"
    users ||--o{ posts : "1:N"
    users ||--o{ post_likes : "1:N"
    users ||--o{ post_favorites : "1:N"
    users ||--o{ comments : "1:N"
    users ||--o{ follows : "follower 1:N"
    users ||--o{ notifications : "1:N"
    users ||--o{ user_behavior_events : "1:N"

    itinerary_generation_task ||--o| itineraries : "1:1"
    itineraries ||--o{ itinerary_items : "1:N"
    itineraries ||--o| posts : "1:1"

    posts ||--o{ post_likes : "1:N"
    posts ||--o{ post_favorites : "1:N"
    posts ||--o{ comments : "1:N"

    users {
        VARCHAR id PK
        VARCHAR email UK
        VARCHAR phone UK
        VARCHAR membership_tier
        INT level
        INT points
        VARCHAR status
        DATETIME created_at
        DATETIME updated_at
    }

    user_profile {
        VARCHAR id PK
        VARCHAR user_id FK
        VARCHAR nickname
        VARCHAR avatar_url
        TEXT bio
        TEXT preference_tags
    }

    user_auth {
        VARCHAR id PK
        VARCHAR user_id FK
        VARCHAR provider
        VARCHAR password_hash
        DATETIME last_login_at
    }

    itinerary_generation_task {
        VARCHAR id PK
        VARCHAR user_id FK
        TEXT user_input
        VARCHAR status
        VARCHAR prompt_version
        VARCHAR trace_id
        LONGTEXT request_payload
        LONGTEXT result_payload
        TEXT failure_reason
        VARCHAR idempotency_key
        VARCHAR itinerary_id FK
        DATETIME completed_at
    }

    itineraries {
        VARCHAR id PK
        VARCHAR user_id FK
        VARCHAR task_id FK
        VARCHAR title
        TEXT summary
        TEXT risk_tips
        LONGTEXT rendered_markdown
        LONGTEXT structured_content
        DATETIME published_at
    }

    itinerary_items {
        VARCHAR id PK
        VARCHAR itinerary_id FK
        INT day_number
        INT sequence_number
        VARCHAR item_title
        VARCHAR activity_type
        VARCHAR address
        VARCHAR start_time
        VARCHAR end_time
        VARCHAR transport_mode
        INT transport_duration_minutes
        TEXT notes
    }

    posts {
        VARCHAR id PK
        VARCHAR itinerary_id FK
        VARCHAR user_id FK
        VARCHAR title
        TEXT content_excerpt
        INT like_count
        INT favorite_count
        INT comment_count
        DATETIME published_at
    }

    post_likes {
        VARCHAR id PK
        VARCHAR post_id FK
        VARCHAR user_id FK
    }

    post_favorites {
        VARCHAR id PK
        VARCHAR post_id FK
        VARCHAR user_id FK
    }

    comments {
        VARCHAR id PK
        VARCHAR post_id FK
        VARCHAR user_id FK
        VARCHAR parent_id
        TEXT content
    }

    follows {
        VARCHAR id PK
        VARCHAR follower_id FK
        VARCHAR followee_id FK
    }

    notifications {
        VARCHAR id PK
        VARCHAR user_id FK
        VARCHAR actor_id
        VARCHAR type
        VARCHAR title
        TEXT content
        VARCHAR related_resource_type
        VARCHAR related_resource_id
        BOOLEAN read_status
    }

    user_behavior_events {
        VARCHAR id PK
        VARCHAR user_id
        VARCHAR event_type
        VARCHAR resource_type
        VARCHAR resource_id
        TEXT payload
    }
```

---

## 3. 核心时序图

### 3.1 注册 → 登录 → JWT

```mermaid
sequenceDiagram
    actor User
    participant Nginx
    participant Java as Java API
    participant Redis
    participant MySQL

    User->>Nginx: POST /api/auth/register
    Nginx->>Java: 转发
    Java->>Redis: 限流检查 (userId + IP)
    Redis-->>Java: 放行
    Java->>MySQL: INSERT users + user_auth + user_profile
    MySQL-->>Java: OK
    Java->>Java: 生成 JWT (access + refresh)
    Java->>Redis: SET auth:refresh:{userId}
    Java-->>User: {accessToken, refreshToken, user}

    User->>Nginx: POST /api/auth/login
    Nginx->>Java: 转发
    Java->>Redis: 限流检查
    Java->>MySQL: 查询 users + user_auth
    Java->>Java: BCrypt 验证密码
    Java->>Java: 生成 JWT
    Java->>Redis: SET auth:refresh:{userId}
    Java-->>User: {accessToken, refreshToken, user}
```

### 3.2 行程任务 → Redis Stream → AI 规划 → 回调

```mermaid
sequenceDiagram
    actor User
    participant Java as Java API
    participant Redis
    participant Python as Python AI Worker
    participant LLM as Ollama / DeepSeek

    User->>Java: POST /api/itinerary-tasks
    Java->>Java: Redisson 分布式锁 (幂等键)
    Java->>MySQL: INSERT itinerary_generation_task (PENDING)
    Java->>Redis: XADD travelmaster:ai:tasks
    Java-->>User: {taskId, status: PENDING}

    loop 轮询
        User->>Java: GET /api/itinerary-tasks/{taskId}
        Java->>MySQL: SELECT task
        Java-->>User: {status: PROCESSING}
    end

    Python->>Redis: XREAD travelmaster:ai:tasks (阻塞)
    Redis-->>Python: 任务消息
    Python->>Python: LangGraph 工作流
    Python->>LLM: 意图解析
    par 并发 fan-out
        Python->>Python: 天气查询
        Python->>Python: POI 校验
        Python->>Python: 路线规划
        Python->>Python: 模板召回
    end
    Python->>Python: 行程渲染 (结构化输出)
    Python->>Java: POST /api/internal/ai/tasks/{taskId}/complete
    Java->>MySQL: UPDATE task (COMPLETED) + INSERT itinerary + items
    Java->>Redis: WebSocket 通知推送
    Java-->>Python: 200 OK

    User->>Java: GET /api/itinerary-tasks/{taskId}
    Java-->>User: {status: COMPLETED, itinerary: {...}}
```

### 3.3 发布帖子 → 点赞 → 通知

```mermaid
sequenceDiagram
    actor Author
    actor Reader
    participant Java as Java API
    participant MySQL
    participant Redis
    participant WS as WebSocket

    Author->>Java: POST /api/itineraries/{id}/publish
    Java->>MySQL: INSERT posts
    Java->>Redis: 清除 feed 缓存
    Java-->>Author: {postId, title, ...}

    Reader->>Java: GET /api/feed
    Java->>Redis: 查询 feed 缓存 (Caffeine L1 → Redis L2)
    alt 缓存命中
        Redis-->>Java: 帖子列表
    else 缓存未命中
        Java->>MySQL: SELECT posts ORDER BY published_at
        Java->>Redis: SET feed 缓存
    end
    Java-->>Reader: [{postId, title, likeCount, ...}]

    Reader->>Java: POST /api/posts/{id}/like
    Java->>MySQL: INSERT post_likes (唯一约束去重)
    Java->>MySQL: UPDATE posts SET like_count = like_count + 1
    Java->>Redis: ZINCRBY ranking:hot-itineraries
    Java->>MySQL: INSERT notifications (type: LIKE)
    Java->>WS: 推送通知给 Author
    Java-->>Reader: {postId, likeCount: N+1}

    Author->>WS: 收到实时通知
```

---

## 4. 索引设计

| 表 | 索引 | 用途 |
|----|------|------|
| `users` | `UNIQUE(email)`, `UNIQUE(phone)` | 登录查询、唯一约束 |
| `user_profile` | `UNIQUE(user_id)` | 1:1 关联 |
| `user_auth` | `UNIQUE(user_id)` | 1:1 关联 |
| `itinerary_generation_task` | `(status, created_at)`, `(user_id, created_at)` | 任务列表分页、状态轮询 |
| `itineraries` | `(user_id, created_at)` | 用户行程列表 |
| `posts` | `(published_at)` | Feed 时间线分页 |
| `post_likes` | `UNIQUE(post_id, user_id)` | 防重复点赞 |
| `post_favorites` | `UNIQUE(post_id, user_id)` | 防重复收藏 |
| `comments` | `(post_id, created_at)` | 帖子评论列表 |
| `follows` | `UNIQUE(follower_id, followee_id)` | 防重复关注 |
| `notifications` | `(user_id, read_status, created_at)` | 未读通知查询 |
| `user_behavior_events` | `(event_type, created_at)` | 行为分析时间范围查询 |

---

## 5. 缓存策略

```
┌─────────────────────────────────────────────┐
│  请求 → Caffeine (JVM L1, 5min TTL, 1000)  │
│     ↓ miss                                  │
│  Redis (L2, 30min TTL)                      │
│     ↓ miss                                  │
│  MySQL                                      │
│     ↓ 结果回写 L1 + L2                      │
└─────────────────────────────────────────────┘

失效策略：领域事件触发
- 点赞/收藏 → 清除帖子详情缓存 + 榜单缓存
- 发布帖子 → 清除 feed 缓存
- 关注 → 清除创作者榜缓存
```

---

## 6. 限流策略

| 接口 | 维度 | 限制 |
|------|------|------|
| 注册 | 邮箱 + IP | 10 次/分钟 (邮箱), 30 次/分钟 (IP) |
| 登录 | 账号 + IP | 20 次/分钟 (账号), 60 次/分钟 (IP) |
| 创建任务 | userId | Redisson 分布式锁 + 幂等键 |
| 点赞/收藏 | userId + postId | 唯一约束去重 |
