# SpringDoc OpenAPI 使用指南

## 📖 概述

TravelMaster 已集成 **SpringDoc OpenAPI**，自动生成交互式 API 文档。无需手动维护接口文档，代码即文档！

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd travel-master-backend
mvn spring-boot:run
```

### 2. 访问 Swagger UI

打开浏览器访问：
- **Swagger UI（交互式文档）**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs
- **OpenAPI YAML**: http://localhost:8080/v3/api-docs.yaml

---

## 📋 功能特性

### ✅ 自动化文档
- 根据 Controller 代码自动生成接口文档
- 支持请求参数、响应格式、状态码说明
- 实时更新，代码修改后文档自动同步

### ✅ 在线测试
- 直接在浏览器中测试 API 接口
- 支持 JWT Token 认证
- 查看请求/响应示例

### ✅ 导出功能
- 导出 OpenAPI JSON/YAML 格式
- 可导入到 Apifox、Postman 等工具
- 生成前端 TypeScript 类型定义

---

## 🔧 为接口添加文档注解

### 基础用法

#### 1. Controller 级别注解

```java
@RestController
@RequestMapping("/api/auth")
@Tag(name = "认证模块", description = "用户注册、登录、Token 管理相关接口")
public class AuthController {
    // ...
}
```

#### 2. 方法级别注解

```java
@PostMapping("/login")
@Operation(
    summary = "用户登录",
    description = "使用账号（邮箱）和密码登录，返回 JWT Access Token 和 Refresh Token"
)
public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    // ...
}
```

#### 3. 参数注解

```java
@GetMapping("/itinerary-tasks/{taskId}")
@Operation(summary = "查询行程任务状态")
public ApiResponse<TaskResponse> getTask(
    @AuthenticationPrincipal AuthenticatedUser currentUser,
    @Parameter(description = "任务 ID", example = "task-123456")
    @PathVariable String taskId
) {
    // ...
}
```

---

## 📝 常用注解说明

### @Tag - 模块分组
```java
@Tag(name = "模块名称", description = "模块描述")
```
用于将接口按功能模块分组显示。

### @Operation - 接口说明
```java
@Operation(
    summary = "简短描述",
    description = "详细说明（支持 Markdown 格式）"
)
```
描述接口的功能和用途。

### @Parameter - 参数说明
```java
@Parameter(
    description = "参数说明",
    required = true,
    example = "示例值"
)
```
描述请求参数的含义和要求。

### @ApiResponse - 响应说明
```java
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "成功"),
    @ApiResponse(responseCode = "400", description = "请求参数错误"),
    @ApiResponse(responseCode = "401", description = "未授权")
})
```
说明各种可能的响应状态码。

---

## 🎨 实际示例

### 完整示例：社交接口

```java
@RestController
@RequestMapping("/api/social")
@Tag(name = "社交模块", description = "点赞、评论、收藏、关注等社交功能")
public class SocialController {
    
    @PostMapping("/posts/{postId}/like")
    @Operation(
        summary = "点赞/取消点赞",
        description = "对帖子进行点赞或取消点赞操作（切换状态）"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "操作成功"),
        @ApiResponse(responseCode = "404", description = "帖子不存在"),
        @ApiResponse(responseCode = "401", description = "未登录")
    })
    public ApiResponse<Void> likePost(
        @AuthenticationPrincipal AuthenticatedUser currentUser,
        @Parameter(description = "帖子 ID", example = "123")
        @PathVariable Long postId
    ) {
        socialService.toggleLike(currentUser.userId(), postId);
        return ApiResponse.success();
    }
}
```

---

## 🔐 JWT 认证配置

Swagger UI 已配置 JWT Bearer Token 认证：

1. 点击右上角 **Authorize** 按钮
2. 输入 Token：`Bearer <your_jwt_token>`
3. 点击 **Authorize** 确认
4. 之后的所有请求都会自动携带 Token

---

## 📤 导出与集成

### 导出 OpenAPI 文档

```bash
# 访问以下 URL 下载文档
http://localhost:8080/v3/api-docs          # JSON 格式
http://localhost:8080/v3/api-docs.yaml     # YAML 格式
```

### 导入到 Apifox

1. 在 Apifox 中创建新项目
2. 选择 **导入数据** → **OpenAPI/Swagger**
3. 粘贴 `http://localhost:8080/v3/api-docs` URL
4. 点击导入，自动同步所有接口

### 导入到 Postman

1. 打开 Postman
2. 点击 **Import** → **Link**
3. 输入 `http://localhost:8080/v3/api-docs`
4. 点击 **Continue** 完成导入

---

## 🛠️ 配置说明

### 自定义配置（可选）

在 `application.properties` 中添加：

```properties
# Swagger UI 路径
springdoc.swagger-ui.path=/swagger-ui.html

# API 文档路径
springdoc.api-docs.path=/v3/api-docs

# 显示 actuator 端点
springdoc.show-actuator=false

# 包扫描路径（默认扫描所有 Controller）
springdoc.packages-to-scan=com.travelmaster

# 分组配置
springdoc.group-configs[0].group=auth
springdoc.group-configs[0].paths-to-match=/api/auth/**
springdoc.group-configs[0].packages-to-scan=com.travelmaster.auth
```

---

## 📊 当前已标注的模块

| 模块 | Controller | 接口数量 | 状态 |
|------|-----------|---------|------|
| 认证模块 | AuthController | 3 | ✅ 已完成 |
| 用户模块 | UserController | 2 | ✅ 已完成 |
| 行程任务模块 | ItineraryTaskController | 2+ | ✅ 已完成 |
| 社交模块 | SocialController | 7 | ✅ 已完成 |
| 通知模块 | NotificationController | 2 | ✅ 已完成 |
| 排行榜模块 | RankingController | 2 | ✅ 已完成 |
| 数据分析模块 | AnalyticsController | 3 | ✅ 已完成 |

**总计**: 7 个模块，21+ 个接口已全部标注完成！🎉

---

## 💡 最佳实践

### 1. 保持简洁
- `summary` 简短明了（不超过 20 字）
- `description` 详细说明业务逻辑和注意事项

### 2. 提供示例
- 为关键参数添加 `example`
- 帮助使用者快速理解参数格式

### 3. 标注所有响应码
- 不仅标注成功情况
- 也要标注各种错误场景

### 4. 使用中文
- 项目名称和描述使用中文
- 便于国内开发者理解

### 5. 及时更新
- 修改接口时同步更新注解
- 保持文档与代码一致

---

## ❓ 常见问题

### Q1: Swagger UI 页面空白？
**A:** 检查后端是否正常启动，访问 `http://localhost:8080/v3/api-docs` 看是否能返回 JSON。

### Q2: 如何隐藏某些接口？
**A:** 在 Controller 或方法上添加 `@Hidden` 注解：
```java
@Hidden
@GetMapping("/internal/debug")
public void debug() { ... }
```

### Q3: 如何添加请求头参数？
**A:** 使用 `@Parameter` 注解：
```java
@Parameter(description = "JWT Token", required = true)
@RequestHeader("Authorization") String token
```

### Q4: 文档没有自动更新？
**A:** SpringDoc 会在每次请求时重新生成文档，确保代码已重新编译。

---

## 📚 参考资料

- [SpringDoc 官方文档](https://springdoc.org/)
- [OpenAPI 规范](https://swagger.io/specification/)
- [Swagger UI 使用指南](https://swagger.io/tools/swagger-ui/)

---

## 🎯 下一步计划

### ✅ 已完成
1. ✅ 集成 SpringDoc OpenAPI 依赖
2. ✅ 创建 OpenAPI 配置类
3. ✅ 为核心 Controller 添加注解
4. ✅ 为所有 Controller 添加注解（7个模块，21+接口）
5. ✅ 编写接口使用指南

### 🔄 进行中
6. ⏳ 为 DTO 类添加字段描述（使用 `@Schema` 注解）
7. ⏳ 配置接口分组（按模块分开显示）
8. ⏳ 添加更多示例数据

### 📅 长期规划
9. ⏳ 导出 OpenAPI JSON 导入到 Apifox
10. ⏳ 利用 Apifox 的 Mock 功能加速前端开发
11. ⏳ 设置自动化测试流程

---

**享受自动化 API 文档带来的便利！** 🚀
