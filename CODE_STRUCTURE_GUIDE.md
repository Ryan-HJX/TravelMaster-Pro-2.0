# TravelMaster 代码结构详解 - 零基础入门指南

## 📚 目录
1. [项目概述](#项目概述)
2. [如何开始阅读代码](#如何开始阅读代码)
3. [后端代码结构](#后端代码结构)
4. [前端代码结构](#前端代码结构)
5. [前后端接口对应关系](#前后端接口对应关系)
6. [开发流程示例](#开发流程示例)
7. [常用工具和命令](#常用工具和命令)

---

## 项目概述

TravelMaster 是一个智能旅行规划系统，采用**前后端分离**的微服务架构：

- **后端**: Java Spring Boot (主服务) + Python FastAPI (AI 行程规划服务)
- **前端**: React + TypeScript + Vite
- **数据库**: MySQL + Redis
- **部署**: Docker Compose

### 核心功能
- 用户注册/登录
- AI 智能生成旅行行程
- 行程查看、编辑、分享
- 地图可视化展示
- 社交互动（点赞、评论）

---

## 如何开始阅读代码

### 🎯 零基础学习路径

#### 第一步：了解整体架构（1-2小时）
1. 阅读根目录的 `README.md` 和 `ARCHITECTURE.md`
2. 查看 `docker-compose.yml` 了解服务组成
3. 理解数据流向：前端 → Java后端 → Python AI服务 → 返回结果

#### 第二步：从前端入手（建议先看前端，更直观）
1. 打开 `travel-master-frontend/src/App.tsx` - 这是前端入口
2. 查看 `travel-master-frontend/src/pages/` - 各个页面组件
3. 查看 `travel-master-frontend/src/services/api.ts` - 所有 API 调用

#### 第三步：理解后端接口
1. 打开 `travel-master-backend/src/main/java/com/travelmaster/controller/` - 控制器层
2. 查看对应的 Service 层和 DTO 层
3. 理解请求如何处理和响应

#### 第四步：追踪一个完整功能
选择一个简单功能（如登录），从前端到后端完整追踪一遍

---

## 后端代码结构

### 📁 Java 后端 (Spring Boot)

```
travel-master-backend/
├── src/main/java/com/travelmaster/
│   ├── TravelMasterApplication.java          # 🚀 应用启动入口
│   │
│   ├── controller/                           # 📡 控制器层 - 接收HTTP请求
│   │   ├── AuthController.java              # 认证相关接口（登录、注册）
│   │   ├── ItineraryController.java         # 行程管理接口
│   │   ├── UserController.java              # 用户信息接口
│   │   └── SocialController.java            # 社交功能接口
│   │
│   ├── service/                              # 💼 服务层 - 业务逻辑
│   │   ├── AuthService.java                 # 认证服务
│   │   ├── ItineraryService.java            # 行程服务
│   │   └── UserService.java                 # 用户服务
│   │
│   ├── dto/                                  # 📦 数据传输对象
│   │   ├── request/                         # 请求参数对象
│   │   │   ├── LoginRequest.java           # 登录请求
│   │   │   └── CreateItineraryRequest.java # 创建行程请求
│   │   └── response/                        # 响应数据对象
│   │       ├── ApiResponse.java            # 统一响应格式
│   │       └── ItineraryResponse.java      # 行程响应
│   │
│   ├── entity/                               # 🗄️ 实体类 - 对应数据库表
│   │   ├── User.java                        # 用户实体
│   │   ├── Itinerary.java                   # 行程实体
│   │   └── Poi.java                         # 兴趣点实体
│   │
│   ├── repository/                           # 📚 数据访问层 - 操作数据库
│   │   ├── UserRepository.java              # 用户数据访问
│   │   └── ItineraryRepository.java         # 行程数据访问
│   │
│   ├── config/                               # ⚙️ 配置类
│   │   ├── SecurityConfig.java             # 安全配置
│   │   ├── RedisConfig.java                # Redis配置
│   │   └── WebConfig.java                  # Web配置（CORS等）
│   │
│   ├── auth/                                 # 🔐 认证授权模块
│   │   ├── JwtTokenProvider.java           # JWT令牌生成
│   │   └── SecurityFilter.java             # 安全过滤器
│   │
│   ├── ai/                                   # 🤖 AI集成模块
│   │   └── client/
│   │       └── PythonAiClient.java         # 调用Python AI服务
│   │
│   └── common/                               # 🛠️ 通用工具
│       ├── exception/                       # 异常处理
│       └── utils/                           # 工具类
│
└── src/main/resources/
    ├── application.properties               # 📝 应用配置文件
    └── db/migration/                        # 🗃️ 数据库迁移脚本
        ├── V1__init_schema.sql             # 初始化表结构
        └── V2__add_social_features.sql     # 添加社交功能
```

### 📁 Python 后端 (FastAPI - AI服务)

```
src/
├── main.py                                 # 🚀 Python服务启动入口
├── api/
│   └── v1/
│       ├── plan.py                         # 📡 行程规划API
│       └── progress.py                     # 📊 进度查询API
│
├── agents/
│   ├── workflow.py                         # 🔄 LangGraph工作流定义
│   └── state.py                            # 📋 Agent状态定义
│
├── planner/
│   └── stages/                             # 📍 规划各阶段
│       ├── intent_parser.py               # 意图解析
│       ├── poi_selector.py                # 景点选择
│       ├── route_optimizer.py             # 路线优化
│       └── renderer.py                    # 结果渲染
│
├── llm/
│   ├── bailian_client.py                  # 🤖 阿里云百炼LLM客户端
│   └── model_router.py                    # 模型路由
│
├── services/
│   ├── travel_service.py                  # 旅行服务核心逻辑
│   └── progress_tracker.py                # 进度追踪
│
└── config/
    └── settings.py                        # ⚙️ 配置管理
```

---

## 前端代码结构

```
travel-master-frontend/
├── src/
│   ├── main.tsx                           # 🚀 前端应用入口
│   ├── App.tsx                            # 📱 主应用组件（路由配置）
│   │
│   ├── pages/                             # 📄 页面组件
│   │   ├── AuthPage.tsx                   # 登录/注册页面
│   │   ├── DashboardPage.tsx              # 仪表盘页面
│   │   ├── ItineraryDetailPage.tsx        # 行程详情页面
│   │   └── SettingsPage.tsx               # 设置页面
│   │
│   ├── components/                        # 🧩 可复用组件
│   │   ├── PlannerInput.tsx              # 行程规划输入表单
│   │   ├── ItineraryViewer.tsx           # 行程查看器
│   │   ├── ItineraryMapView.tsx          # 行程地图展示
│   │   ├── CityMap.tsx                   # 城市地图
│   │   ├── ChinaMap.tsx                  # 中国地图（足迹）
│   │   ├── HistoryList.tsx               # 历史记录列表
│   │   └── TravelBudgetAdvisor.tsx       # 预算建议组件
│   │
│   ├── hooks/                             # 🪝 自定义Hooks
│   │   ├── useTravelPlanner.ts           # 行程规划Hook
│   │   └── useNotificationWs.ts          # WebSocket通知Hook
│   │
│   ├── services/
│   │   └── api.ts                        # 🌐 API调用封装（重点！）
│   │
│   ├── assets/                            # 🖼️ 静态资源
│   │   ├── hero.png
│   │   └── icons.svg
│   │
│   └── App.css / index.css               # 🎨 样式文件
│
├── public/                                # 📂 公共资源
│   ├── favicon.svg
│   └── icons.svg
│
├── package.json                           # 📦 依赖配置
├── vite.config.ts                         # ⚙️ Vite配置
└── .env                                   # 🔑 环境变量
```

---

## 前后端接口对应关系

### 🔑 核心概念

**前端**通过 **HTTP请求** 调用 **后端API**，流程如下：

```
用户操作 → 前端组件 → api.ts封装 → HTTP请求 → Java Controller 
→ Service处理 → 数据库操作 → 返回JSON → 前端更新UI
```

### 📋 主要接口对照表

#### 1️⃣ 认证相关接口

| 功能 | 前端调用位置 | 前端API方法 | 后端Controller | 后端URL | 请求方法 |
|------|-------------|------------|----------------|---------|---------|
| 用户登录 | `AuthPage.tsx` | `api.login()` | `AuthController.java` | `/api/auth/login` | POST |
| 用户注册 | `AuthPage.tsx` | `api.register()` | `AuthController.java` | `/api/auth/register` | POST |
| 获取用户信息 | `DashboardPage.tsx` | `api.getUserInfo()` | `UserController.java` | `/api/user/profile` | GET |

**代码示例追踪：**

**前端调用（`AuthPage.tsx`）：**
```typescript
// 用户点击登录按钮
const handleLogin = async () => {
  try {
    // 调用 api.ts 中封装的方法
    const response = await api.login({
      account: formData.account,  // 账号
      password: formData.password  // 密码
    });
    
    // 保存token
    localStorage.setItem('token', response.data.token);
    // 跳转到首页
    navigate('/dashboard');
  } catch (error) {
    console.error('登录失败', error);
  }
};
```

**API封装（`services/api.ts`）：**
```typescript
export const api = {
  // 登录方法
  login: (data: LoginRequest) => 
    axios.post('/api/auth/login', data),
  
  // 注册方法
  register: (data: RegisterRequest) => 
    axios.post('/api/auth/register', data),
};
```

**后端接收（`AuthController.java`）：**
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    // 处理登录请求
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        // 调用服务层处理业务逻辑
        LoginResponse response = authService.login(request);
        return ApiResponse.success(response);
    }
}
```

**服务层处理（`AuthService.java`）：**
```java
@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    public LoginResponse login(LoginRequest request) {
        // 1. 查询用户
        User user = userRepository.findByAccount(request.getAccount());
        
        // 2. 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException("密码错误");
        }
        
        // 3. 生成JWT token
        String token = jwtTokenProvider.generateToken(user.getId());
        
        // 4. 返回响应
        return new LoginResponse(token, user.getUsername());
    }
}
```

---

#### 2️⃣ 行程规划接口（核心功能）

| 功能 | 前端调用位置 | 前端API方法 | 后端Controller | 后端URL | 请求方法 |
|------|-------------|------------|----------------|---------|---------|
| 创建行程 | `PlannerInput.tsx` | `api.createItinerary()` | `ItineraryController.java` | `/api/itineraries` | POST |
| 获取行程列表 | `DashboardPage.tsx` | `api.getItineraries()` | `ItineraryController.java` | `/api/itineraries` | GET |
| 获取行程详情 | `ItineraryDetailPage.tsx` | `api.getItinerary(id)` | `ItineraryController.java` | `/api/itineraries/{id}` | GET |
| AI生成行程 | `useTravelPlanner.ts` | SSE流式请求 | `ItineraryController.java` | `/api/itineraries/generate` | POST (SSE) |

**AI行程生成完整流程（最复杂的功能）：**

```
前端输入需求 → Java后端接收 → 转发给Python AI服务 → 
LangGraph工作流执行 → 调用LLM → 生成行程 → 返回给Java → 
存储到数据库 → 流式返回给前端 → 实时展示
```

**前端调用（`hooks/useTravelPlanner.ts`）：**
```typescript
export const useTravelPlanner = () => {
  const generateItinerary = async (params: PlanParams) => {
    // 使用Server-Sent Events (SSE) 接收流式响应
    const eventSource = new EventSource(
      `/api/itineraries/generate?destination=${params.destination}&days=${params.days}`
    );
    
    eventSource.onmessage = (event) => {
      // 实时接收AI生成的进度和内容
      const data = JSON.parse(event.data);
      updateProgress(data); // 更新进度条
      updateContent(data.content); // 实时更新行程内容
    };
    
    eventSource.onerror = () => {
      eventSource.close();
    };
  };
  
  return { generateItinerary };
};
```

**Java后端接收（`ItineraryController.java`）：**
```java
@RestController
@RequestMapping("/api/itineraries")
public class ItineraryController {
    
    @Autowired
    private ItineraryService itineraryService;
    
    @Autowired
    private PythonAiClient pythonAiClient; // 调用Python服务
    
    // AI生成行程（SSE流式响应）
    @PostMapping(value = "/generate", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateItinerary(@RequestBody PlanRequest request) {
        SseEmitter emitter = new SseEmitter();
        
        // 异步调用Python AI服务
        CompletableFuture.runAsync(() -> {
            try {
                // 调用Python服务的SSE接口
                pythonAiClient.generatePlanStream(request, emitter);
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });
        
        return emitter;
    }
}
```

**Python AI服务（`api/v1/plan.py`）：**
```python
@router.post("/generate")
async def generate_plan(request: PlanRequest):
    """AI行程规划接口"""
    
    # 创建SSE流
    async def event_generator():
        # 1. 解析用户意图
        yield format_sse({"stage": "intent_parsing", "status": "processing"})
        intent = await intent_parser.parse(request.query)
        
        # 2. 选择景点
        yield format_sse({"stage": "poi_selection", "status": "processing"})
        pois = await poi_selector.select(intent, request.days)
        
        # 3. 优化路线
        yield format_sse({"stage": "route_optimization", "status": "processing"})
        route = await route_optimizer.optimize(pois)
        
        # 4. 生成最终行程
        yield format_sse({"stage": "rendering", "status": "processing"})
        itinerary = await renderer.render(route)
        
        # 5. 返回完整结果
        yield format_sse({"stage": "complete", "data": itinerary})
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

---

#### 3️⃣ 社交功能接口

| 功能 | 前端调用位置 | 前端API方法 | 后端Controller | 后端URL | 请求方法 |
|------|-------------|------------|----------------|---------|---------|
| 点赞行程 | `ItineraryViewer.tsx` | `api.likeItinerary(id)` | `SocialController.java` | `/api/social/like/{id}` | POST |
| 发表评论 | `ItineraryDetailPage.tsx` | `api.addComment()` | `SocialController.java` | `/api/social/comments` | POST |
| 获取评论列表 | `ItineraryDetailPage.tsx` | `api.getComments(id)` | `SocialController.java` | `/api/social/comments/{id}` | GET |

---

#### 4️⃣ 用户足迹接口

| 功能 | 前端调用位置 | 前端API方法 | 后端Controller | 后端URL | 请求方法 |
|------|-------------|------------|----------------|---------|---------|
| 获取足迹数据 | `ChinaMap.tsx` | `api.getFootprints()` | `UserController.java` | `/api/user/footprints` | GET |
| 更新足迹 | 自动生成 | 内部调用 | `UserController.java` | `/api/user/footprints` | POST |

---

### 🔍 如何追踪一个接口的完整流程

以 **"获取行程详情"** 为例：

#### 步骤1：找到前端调用位置
在 `ItineraryDetailPage.tsx` 中搜索：
```typescript
useEffect(() => {
  // 页面加载时获取行程详情
  const fetchItinerary = async () => {
    const response = await api.getItinerary(itineraryId);
    setItinerary(response.data);
  };
  fetchItinerary();
}, [itineraryId]);
```

#### 步骤2：查看API封装
在 `services/api.ts` 中找到：
```typescript
getItinerary: (id: string) => 
  axios.get(`/api/itineraries/${id}`)
```

#### 步骤3：找到后端Controller
在 `ItineraryController.java` 中搜索：
```java
@GetMapping("/{id}")
public ApiResponse<ItineraryResponse> getItinerary(@PathVariable Long id) {
    ItineraryResponse response = itineraryService.getItineraryById(id);
    return ApiResponse.success(response);
}
```

#### 步骤4：查看Service层业务逻辑
在 `ItineraryService.java` 中：
```java
public ItineraryResponse getItineraryById(Long id) {
    // 1. 从数据库查询
    Itinerary itinerary = itineraryRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("行程不存在"));
    
    // 2. 转换为DTO
    return itineraryMapper.toResponse(itinerary);
}
```

#### 步骤5：查看数据访问层
在 `ItineraryRepository.java` 中：
```java
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    // Spring Data JPA 自动生成查询方法
}
```

---

## 开发流程示例

### 📝 场景：添加一个新功能"收藏行程"

#### 1. 数据库设计
创建迁移脚本 `V3__add_favorite_feature.sql`：
```sql
CREATE TABLE favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    itinerary_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(id),
    UNIQUE KEY unique_favorite (user_id, itinerary_id)
);
```

#### 2. 后端开发

**创建实体类** `Favorite.java`：
```java
@Entity
@Table(name = "favorites")
public class Favorite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long userId;
    private Long itineraryId;
    private LocalDateTime createdAt;
    
    // getter/setter...
}
```

**创建Repository** `FavoriteRepository.java`：
```java
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    boolean existsByUserIdAndItineraryId(Long userId, Long itineraryId);
}
```

**创建DTO** `FavoriteRequest.java` 和 `FavoriteResponse.java`

**创建Service** `FavoriteService.java`：
```java
@Service
public class FavoriteService {
    @Autowired
    private FavoriteRepository favoriteRepository;
    
    public void addFavorite(Long userId, Long itineraryId) {
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setItineraryId(itineraryId);
        favoriteRepository.save(favorite);
    }
    
    public List<FavoriteResponse> getUserFavorites(Long userId) {
        // 查询并转换...
    }
}
```

**创建Controller** `FavoriteController.java`：
```java
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    @Autowired
    private FavoriteService favoriteService;
    
    @PostMapping
    public ApiResponse<Void> addFavorite(@RequestBody FavoriteRequest request) {
        favoriteService.addFavorite(request.getUserId(), request.getItineraryId());
        return ApiResponse.success();
    }
    
    @GetMapping
    public ApiResponse<List<FavoriteResponse>> getFavorites(@RequestParam Long userId) {
        return ApiResponse.success(favoriteService.getUserFavorites(userId));
    }
}
```

#### 3. 前端开发

**在 `api.ts` 中添加API方法**：
```typescript
export const api = {
  // ... 其他方法
  
  addFavorite: (data: FavoriteRequest) => 
    axios.post('/api/favorites', data),
  
  getFavorites: (userId: number) => 
    axios.get(`/api/favorites?userId=${userId}`),
};
```

**创建组件或使用现有组件调用**：
```typescript
// 在 ItineraryDetailPage.tsx 中添加收藏按钮
const handleFavorite = async () => {
  await api.addFavorite({
    userId: currentUser.id,
    itineraryId: itinerary.id
  });
  message.success('收藏成功');
};

<Button onClick={handleFavorite}>⭐ 收藏</Button>
```

#### 4. 测试
- 启动后端：`mvn spring-boot:run`
- 启动前端：`npm run dev`
- 测试收藏功能

---

## 常用工具和命令

### 🔧 开发环境启动

**启动所有服务（Docker）：**
```bash
docker-compose up -d
```

**单独启动Java后端：**
```bash
cd travel-master-backend
mvn spring-boot:run
```

**单独启动Python AI服务：**
```bash
python main.py
```

**启动前端：**
```bash
cd travel-master-frontend
npm run dev
```

### 📊 查看日志

**Java后端日志：**
```bash
docker-compose logs -f java-backend
```

**Python服务日志：**
```bash
docker-compose logs -f python-ai
```

**前端控制台：**
浏览器按 F12 打开开发者工具

### 🗄️ 数据库操作

**连接MySQL：**
```bash
docker-compose exec mysql mysql -u root -p
```

**查看Redis：**
```bash
docker-compose exec redis redis-cli
```

### 🧪 测试接口

**使用curl测试登录：**
```powershell
curl -X POST http://localhost:8080/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"account":"test","password":"123456"}'
```

**使用Postman或Apifox：**
导入项目中的接口文档进行可视化测试

---

## 🎓 学习建议

### 第1周：理解基础
- ✅ 阅读 README 和 ARCHITECTURE.md
- ✅ 启动项目，体验所有功能
- ✅ 理解前后端分离的概念
- ✅ 学会查看浏览器开发者工具的 Network 面板

### 第2周：深入前端
- ✅ 学习 React 基础（组件、Props、State、Hooks）
- ✅ 理解 `App.tsx` 的路由配置
- ✅ 追踪一个简单功能（如登录）的完整流程
- ✅ 学习 TypeScript 基础类型

### 第3周：深入后端
- ✅ 学习 Spring Boot 基础（Controller、Service、Repository）
- ✅ 理解 RESTful API 设计规范
- ✅ 学习 JPA/Hibernate 数据库操作
- ✅ 理解 JWT 认证机制

### 第4周：综合实践
- ✅ 尝试添加一个小功能（如修改用户昵称）
- ✅ 学习调试技巧（断点、日志）
- ✅ 理解微服务之间的调用
- ✅ 学习 Docker 基础

---

## ❓ 常见问题

### Q1: 如何知道前端调用了哪个后端接口？
**A:** 打开浏览器开发者工具（F12）→ Network 面板 → 执行操作 → 查看请求的 URL

### Q2: 后端接口返回的数据结构是什么样的？
**A:** 查看对应的 DTO 类（`dto/response/` 目录），或者直接在浏览器 Network 面板查看响应

### Q3: 如何修改接口的返回值？
**A:** 
1. 修改后端 DTO 类
2. 修改 Service 层的转换逻辑
3. 前端相应调整数据使用方式

### Q4: 前端如何传递参数给后端？
**A:** 
- GET 请求：URL 查询参数 `?key=value`
- POST 请求：请求体（JSON格式）

### Q5: 如何调试前后端联调问题？
**A:** 
1. 检查浏览器 Console 是否有错误
2. 检查 Network 面板的请求状态码
3. 查看后端日志
4. 使用 Postman 单独测试后端接口

---

## 📚 推荐学习资源

### 前端
- React 官方文档：https://react.dev
- TypeScript 官方文档：https://www.typescriptlang.org
- Axios 文档：https://axios-http.com

### 后端
- Spring Boot 官方文档：https://spring.io/projects/spring-boot
- Spring Data JPA：https://spring.io/projects/spring-data-jpa
- JWT 介绍：https://jwt.io/introduction

### 全栈
- RESTful API 设计：https://restfulapi.net
- HTTP 协议详解：https://developer.mozilla.org/zh-CN/docs/Web/HTTP

---

## 🎯 总结

对于零基础学习者，建议的学习顺序：

1. **先体验产品** - 运行项目，熟悉所有功能
2. **从前端入手** - 更直观，容易看到效果
3. **追踪简单功能** - 如登录、查看列表
4. **理解数据流** - 前端 → API → 后端 → 数据库 → 返回
5. **逐步深入** - 从 Controller → Service → Repository
6. **动手实践** - 尝试修改小功能，加深理解

记住：**不要试图一次性理解所有代码**，先从一个小功能开始，完整追踪一遍，建立信心后再扩展到其他功能。

祝学习顺利！🚀
