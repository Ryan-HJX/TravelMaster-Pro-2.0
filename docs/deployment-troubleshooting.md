# TravelMaster 部署与开发常见问题排查 (Troubleshooting)

本文档记录了在本地部署和开发 TravelMaster 项目时遇到的典型问题及其解决方案。

---

## 1. Hibernate 枚举类型校验失败 (Schema-validation Error)

### 现象
启动 Java 后端时报错：
`org.hibernate.tool.schema.spi.SchemaManagementException: Schema-validation: wrong column type encountered in column [status] ... found [varchar], but expecting [enum]`

### 原因
为了实现**跨数据库兼容**（支持 MySQL, PostgreSQL, H2 等），Flyway 脚本中使用通用的 `VARCHAR` 定义枚举字段。但 Hibernate 6.x 在校验模式下，如果实体类使用了 `@Enumerated(EnumType.STRING)` 且未指定 `columnDefinition`，可能会期望数据库使用原生 `ENUM` 类型，从而导致校验不通过。

### 解决方案
在所有使用枚举的 JPA 实体类中，显式指定 `columnDefinition = "VARCHAR(...)"`。

**修改示例 (`ItineraryGenerationTask.java`):**
```java
@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
private TaskStatus status;
```

**涉及文件：**
- `ItineraryGenerationTask.java`
- `Notification.java`
- `AppUser.java`
- `UserAuth.java`

---

## 2. LangGraph 节点名与状态键冲突 (ValueError)

### 现象
启动 Python AI 服务时报错：
`ValueError: 'intent' is already being used as a state key`

### 原因
在 LangGraph 的 `StateGraph` 中，**节点名称（Node Name）不能与状态字典（State Dict）中的键名（Key）相同**。因为 LangGraph 需要区分是“调用一个节点”还是“更新状态中的某个字段”。

### 解决方案
修改 `src/agents/workflow.py`，将节点名称改为更具描述性的动作名称，避开状态键名。

**修改对照表：**
| 原节点名 (冲突) | 新节点名 (推荐) | 对应状态键 |
| :--- | :--- | :--- |
| `intent` | `intent_parser` | `intent` |
| `geo_grounding` | `geo_grounder` | `geo_grounding` |
| `poi_pool` | `poi_selector` | `enriched_pois` |
| `route_optimization` | `route_optimizer` | `route_options` |
| `weather_adjustment` | `weather_adjuster` | `weather_forecast` |
| `finance_advice` | `finance_advisor` | `finance_summary` |
| `transport_planning` | `transport_planner` | `transport_plan` |
| `render` | `renderer` | `plan` |

---

## 3. 阿里云百炼 API Key 鉴权失败 (401 InvalidApiKey)

### 现象
Python 终端输出：
`bailian flash failed, falling back to ollama: Error code: 401 - {'code': 'InvalidApiKey', ...}`

### 原因
`.env` 文件中 `DASHSCOPE_API_KEY` 仍为占位符，或者填写的 Key 已过期/无效。系统会自动尝试降级到本地 Ollama。

### 解决方案
1. 登录 [阿里云百炼控制台](https://bailian.console.aliyun.com/) 获取有效的 API Key。
2. 在项目根目录的 `.env` 文件中填入：
   ```properties
   DASHSCOPE_API_KEY=sk-你的真实Key
   MODEL_PRIORITY=cloud
   ```
3. 重启 Python 服务 (`uvicorn main:app --reload`)。

---

## 4. Flyway 迁移脚本与现有表结构不一致

### 现象
即使重置了 Docker 容器，依然报列类型错误。

### 原因
Docker 的 **Volume (数据卷)** 具有持久性。简单的 `docker-compose down` 不会删除数据卷，导致旧的表结构残留。

### 解决方案
执行彻底清理命令：
```powershell
docker-compose down -v
docker volume prune -f
```
然后再重新启动数据库容器。

---

## 5. Redis Stream 任务投递与消费失败

### 现象
Java 后端返回任务创建成功，但 Python AI 服务没有反应，或者报 `KeyError: 'taskId'`。

### 原因
1. **Java 未写入 Stream**：检查 `AiTaskPublisher` 是否被正确调用，以及 Redis 连接是否正常。
2. **Payload 格式不匹配**：Java 发送的键名（如 `taskId`）必须与 Python `stream_worker.py` 中解析的键名完全一致。
3. **Worker 异常中断**：如果 Python Worker 在处理某条消息时崩溃，可能会导致后续消息无法消费。

### 解决方案
*   在 Java 端增加日志打印，确认 `redisTemplate.opsForStream().add()` 执行成功。
*   在 Python 端打印接收到的原始 Payload：`print(f"[DEBUG] Received payload: {payload}")`。
*   使用 `XLEN travelmaster:ai:tasks` 检查 Redis 队列是否有积压。

---

## 6. LLM 模型配置与云端降级失效

### 现象
Python 终端持续输出 `bailian call failed, falling back to ollama`，且本地模型解析 JSON 失败（`parse failed`）。

### 原因
1. **模型名称错误**：阿里云百炼不支持非标准模型名（如 `qwen3.6-plus`），会导致 API 返回 `400 InvalidParameter`。
2. **配置未重载**：修改 `.env` 后，如果没有彻底重启 Python 进程（关闭终端重开），`pydantic-settings` 可能仍在使用旧的环境变量或默认值。

### 解决方案
*   **使用标准模型名**：在 `.env` 和 `src/config/settings.py` 中统一使用 `qwen-turbo` 和 `qwen-plus`（或项目配置的 `qwen3-plus` / `qwen3-flash`）。
*   **双重保险**：确保 `settings.py` 中的默认值也是正确的，防止 `.env` 读取失败时回退到错误模型。
*   **彻底重启**：修改配置后，务必关闭当前终端窗口并重新运行 `uvicorn`。

---

## 7. Java 后端处理不完整 AI 结果时的 500 错误

### 现象
Python 调用 `/complete` 接口时，Java 报 `SQL Error: 1048, Column 'day_number' cannot be null`。

### 原因
当 AI 解析失败时，返回的行程数据中关键字段（如天数）为空。Java 代码在遍历保存时没有做空值校验，直接触发了数据库非空约束。

### 解决方案
在 `ItineraryTaskService.java` 中增加健壮性检查：
```java
if (dayPlan.items() == null || dayPlan.dayNumber() == null) {
    continue; // 跳过无效数据，而不是让整个事务回滚
}
```
