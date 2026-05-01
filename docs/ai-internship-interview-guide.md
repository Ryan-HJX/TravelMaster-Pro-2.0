# AI 应用开发实习生 - 模拟面试问答文档

## 职位背景分析
**目标公司**：通用AI平台（赋能传统工业软件 PLM/ALM/ERP/MES）
**核心职责**：基于 LangGraph 框架的 Agent 开发，涉及工具调用、CLI、Skills、长短期记忆等 Harness 工程。
**核心要求**：有 LangGraph/LangChain/Deerflow 实战经验，具备计算机科学背景。

### 📖 核心名词术语表

#### 1. 工业软件四大支柱 (The Industrial Software Pillars)
*   **PLM (Product Lifecycle Management - 产品生命周期管理)**：
    *   **通俗解释**：管理一个产品从“出生”到“死亡”的全过程。比如设计一辆车，从最初的草图、3D建模、零件选型，到最后的报废回收，所有数据都在 PLM 里。
    *   **AI 赋能点**：利用 AI 辅助生成零件设计图、自动检查设计规范冲突、预测零部件寿命。
*   **ALM (Application Lifecycle Management - 应用生命周期管理)**：
    *   **通俗解释**：主要针对软件开发。管理代码从编写、测试、发布到维护的全过程。
    *   **AI 赋能点**：AI 自动生成测试用例、自动修复 Bug、根据需求文档生成代码框架。
*   **ERP (Enterprise Resource Planning - 企业资源计划)**：
    *   **通俗解释**：企业的“大管家”。管钱（财务）、管人（HR）、管物（库存）、管订单。它确保公司各部门信息同步。
    *   **AI 赋能点**：智能财务预测、自动化采购补货建议、供应链风险预警。
*   **MES (Manufacturing Execution System - 制造执行系统)**：
    *   **通俗解释**：工厂车间的“指挥官”。它监控生产线上的每一台机器、每一个工人的实时操作，确保生产按计划进行。
    *   **AI 赋能点**：设备故障预测性维护、生产参数自动调优、视觉质检。

#### 2. TravelMaster 9 段式工作流详解
*   **Intent (意图解析)**：理解用户到底想去哪、玩几天、预算多少。相当于 ERP 中的“订单接收与解析”。
*   **Geo Grounding (地理校准)**：把模糊的城市名变成精确的经纬度坐标。相当于 MES 中确定工件在生产线上的具体位置。
*   **POI Selection (兴趣点筛选)**：根据偏好挑选景点和餐厅。相当于 PLM 中根据性能指标筛选合适的零部件。
*   **Route Optimization (路线优化)**：规划怎么走最顺路、最省时。相当于物流系统中的路径规划算法。
*   **Weather Adjustment (天气调整)**：根据天气预报动态调整行程（如下雨改室内）。相当于 ALM 中根据环境变化调整部署策略。
*   **Scoring (质量评估)**：给生成的行程打分，看是否太累或不合理。相当于工业软件中的“合规性检查”。
*   **Finance Advisor (资金建议)**：结合盈米金融 MCP 提供理财和预算建议。相当于 ERP 中的资金管理模块。
*   **Transport Planner (大交通规划)**：规划往返的飞机或火车。相当于供应链管理中的干线运输调度。
*   **Renderer (行程渲染)**：将结构化数据转化为可视化的 Markdown 文档和地图。相当于 BI（商业智能）报表的生成。

---

## 🎤 自我介绍模版 (1-3 分钟版本)

**面试官好，我叫 [您的名字]，是 [学校名称] [专业名称] 的 [年级] 学生。**

我今天的自我介绍主要围绕 **“AI Agent 工程化落地”** 这一核心能力展开。

**第一，在技术栈方面：**
我熟练掌握 **Python** 和 **Java** 双语言开发。在 AI 领域，我深入实践了 **LangGraph** 框架，能够设计复杂的多节点工作流；同时熟悉 **MCP (Model Context Protocol)** 协议，具备将 LLM 与外部工具（如高德地图、金融数据接口）集成的实战经验。

**第二，在项目实战方面：** 
我独立开发了 **TravelMaster Pro** —— 一个基于微服务架构的智能旅行规划平台。
*   **在 AI 编排上**：我设计了包含意图解析、地理校准、路线优化等 **9 个阶段的 LangGraph 工作流**。为了解决 LLM 输出不稳定的问题，我建立了一套包含 Prompt 约束、后处理清洗和异常降级的“三层防御机制”。
*   **在 Harness 工程上**：为了保证工业级的稳定性，我实现了 **“云端优先 + 本地 Ollama 降级”** 的路由策略，并利用 **Redis Stream** 构建了异步任务队列，解决了长耗时 AI 任务的并发瓶颈。
*   **在全栈交付上**：我打通了从 React 前端、Spring Boot 后端到 Python AI 服务的完整链路，实现了行程规划的实时进度追踪和可视化展示。

**第三，关于岗位匹配度：**
我注意到贵司正在打造赋能 PLM/ERP 等工业软件的通用 AI 平台。我认为我的项目经验与贵司的需求高度契合：
1.  **流程编排能力**：我将旅行规划拆解为 9 个标准化节点的经验，可以迁移到工业软件复杂的业务流程自动化中。
2.  **工具链集成能力**：我通过 MCP 集成外部数据的实践，与贵司连接 SAP、MES 等工业系统的逻辑是相通的。
3.  **工程化思维**：我关注的不仅仅是模型效果，更是如何通过 Harness 工程（如监控、降级、重试）让 AI 应用在真实场景中稳定运行。

**最后，**
我是一个对前沿技术充满热情，且具备极强动手能力的开发者。我非常期待能加入贵司，用我的全栈 AI 工程能力，帮助传统工业软件加速智能化转型。谢谢！

---

## 第一部分：LangGraph 与 Agent 架构深度拷打

### Q1: 请介绍一下你项目中 LangGraph 的工作流设计？为什么选择 LangGraph 而不是原生的 LangChain？

**参考答案：**
在我的 TravelMaster 项目中，我设计了一个 **9 段式串行工作流**（Intent → Geo Grounding → POI Selection → Route Optimization → Weather Adjustment → Scoring → Finance Advisor → Transport Planner → Renderer）。

我选择 LangGraph 而非原生 LangChain 的核心原因在于 **“状态管理的细粒度控制”**：
1.  **状态持久化与传递**：LangGraph 的 `StateGraph` 允许我定义一个强类型的 `TravelState`（基于 TypedDict）。每个节点（Node）都可以读取和修改这个全局状态。例如，`geo_grounding_node` 获取的城市坐标会被自动传递给后续的 `poi_selector_node` 使用，无需在函数间手动传递大量参数。
2.  **可观测性**：通过 LangGraph，我可以轻松地在每个节点执行前后插入进度追踪逻辑（如更新 Redis Hash），实现前端实时的“步骤条”展示。
3.  **循环与分支潜力**：虽然目前我是串行执行，但 LangGraph 原生支持条件边（Conditional Edges）。如果未来需要增加“用户反馈修正”环节，我可以轻松让流程从 Renderer 跳回 Intent Parser 进行迭代，这是原生 Chain 难以实现的。

**代码佐证：**
```python
# src/agents/workflow.py
def create_travel_graph():
    workflow = StateGraph(TravelState)
    # ... 添加节点 ...
    workflow.add_edge("intent_parser", "geo_grounder")
    # ... 设置入口和出口 ...
    return workflow.compile()
```

### Q2: 在你的 Agent 中，如何处理 LLM 输出不稳定的问题（如 JSON 解析失败）？

**参考答案：**
LLM 输出不稳定是 Agent 工程化的最大痛点。我采用了 **“三层防御机制”**：
1.  **Prompt 约束**：在 System Prompt 中明确要求“只输出 JSON，不要包含 Markdown 代码块或其他文字”。
2.  **后处理清洗**：在代码层面，我会先尝试提取 ` ```json ` 和 ` ``` ` 之间的内容。如果提取失败，再尝试直接解析整个字符串。
3.  **异常降级（Fallback）**：如果 `json.loads` 依然抛出异常，我会捕获它并返回一个带有默认值的对象，确保整个工作流不会因为单个节点的解析错误而崩溃。

**代码佐证：**
```python
# src/planner/stages/intent_parser.py
try:
    if "```" in text:
        text = text.split("```json")[-1].split("```")[0].strip()
    data = json.loads(text)
    intent = TravelIntent(**data)
except (json.JSONDecodeError, Exception) as exc:
    logger.warning("intent parse failed, using defaults: %s", exc)
    # Fallback logic
    intent = TravelIntent(city=user_input[:10], days=3)
```

### Q3: 你的 Agent 是如何实现工具调用（Tool Calling）的？有没有遇到过工具调用死循环的情况？

**参考答案：**
我通过阿里云百炼的 Responses API 集成了 **MCP (Model Context Protocol)** 工具。
1.  **工具注册**：我在 `tool_registry.py` 中定义了高德地图和盈米金融的 MCP 服务器配置。
2.  **自动路由**：在 `model_router.py` 中，我将这些工具配置传递给 `BailianClient`。LLM 会根据用户意图自动决定是否需要调用工具（如查询天气或搜索 POI）。
3.  **关于死循环**：在早期的 Deerflow 实验中，我确实遇到过 LLM 反复调用同一个无效工具的情况。解决办法是在 Prompt 中增加“最大重试次数”的限制，或者在代码层面对同一参数的重复调用进行去重拦截。在目前的 TravelMaster 中，由于我主要采用“显式节点调用”而非“完全自主 ReAct”，这种风险被大大降低了。

---

## 第二部分：Harness 工程与系统稳定性

### Q4: 什么是 Harness 工程？你在项目中如何体现 Harness 的思想？

**参考答案：**
Harness 工程可以理解为 **“给 AI 穿上防护服”**，即围绕 LLM 构建的可靠性、可观测性和安全性基础设施。在我的项目中，主要体现在以下三点：
1.  **模型降级策略（Reliability）**：我设计了“云端优先 + 本地降级”的路由机制。如果阿里云百炼 API 超时或 Key 失效，系统会自动切换到本地的 Ollama (gemma4:e2b) 模型，保证服务不中断。
2.  **全链路追踪（Observability）**：我在 `TravelState` 中维护了 `skill_traces` 和 `mcp_tool_calls` 列表。每一次 LLM 调用的耗时、使用的模型版本、调用的 MCP 工具参数都会被记录下来，方便后续的性能分析和 Debug。
3.  **异步任务队列（Scalability）**：考虑到行程规划耗时较长（10-30秒），我没有让前端同步等待，而是利用 **Redis Stream** 实现了异步 Worker 模式。Java 后端投递任务，Python Worker 消费并处理，最后通过回调通知 Java。

**代码佐证：**
```python
# src/llm/model_router.py
async def call_main(self, ...):
    if settings.MODEL_PRIORITY == "cloud" and settings.DASHSCOPE_API_KEY:
        try:
            return await client.plan_with_mcp(...)
        except Exception as exc:
            logger.warning("bailian call failed, falling back to ollama: %s", exc)
    return await self._call_ollama(prompt) # Fallback
```

### Q5: 如果让你为这个 Agent 增加“长短期记忆”，你会怎么设计？

**参考答案：**
这是一个非常好的问题。目前的 TravelMaster 是无状态的，每次规划都是全新的。如果要增加记忆，我会分层设计：
1.  **短期记忆（Session Memory）**：利用 LangGraph 的 `CheckpointSaver`（如 RedisSaver）。它可以保存对话的历史状态。如果用户对生成的行程说“把第二天的景点换成博物馆”，Agent 可以从 Checkpoint 恢复上一轮的状态，只修改第二天的小部分节点，而不需要重新跑完整个 9 步流程。
2.  **长期记忆（User Profile）**：我会建立一个向量数据库（如 Milvus 或 PGVector）。当用户完成一次旅行后，将他的偏好（如“喜欢安静”、“不吃辣”） Embedding 后存入数据库。下次规划时，在 `intent_parser` 节点先检索用户的历史画像，作为 System Prompt 的一部分注入给 LLM。

---

## 第三部分：工业场景与业务落地

### Q6: 我们的平台是面向工业软件（PLM/ERP）的。你觉得你的旅行 Agent 经验如何迁移到工业场景？

**参考答案：**
虽然领域不同，但 **Agent 的核心范式是相通的**：
1.  **复杂流程编排**：旅行规划的 9 步工作流类似于 ERP 中的“订单处理流程”（接单→库存检查→物流匹配→财务结算）。LangGraph 的状态机思想可以直接复用。
2.  **工具链集成**：我在项目中集成的“高德地图 MCP”和“盈米金融 MCP”，本质上和工业场景中的“SAP 接口”或“MES 传感器数据”是一样的。都是通过标准化的协议（如 MCP 或 RESTful）让 LLM 能够操作外部系统。
3.  **容错与降级**：工业场景对稳定性要求极高。我在项目中实践的“模型降级”和“异常捕获”逻辑，正是工业级 AI 应用必须具备的 Harness 能力。

### Q7: 在处理高并发请求时，你的 Python 服务是如何优化的？

**参考答案：**
1.  **异步 IO**：整个服务基于 FastAPI 和 `async/await` 构建。在等待 LLM 响应或 Redis IO 时，事件循环可以处理其他请求，极大提高了吞吐量。
2.  **读写分离与缓存**：进度信息存储在 Redis Hash 中，读取速度极快。
3.  **Worker 隔离**：通过 Redis Stream 将“接收请求”和“执行规划”解耦。即使 Python Worker 处理较慢，Java 主服务也不会被阻塞，可以通过增加 Worker 实例来实现水平扩展。

---

## 第四部分：反向提问与个人成长

### Q8: 你在开发过程中遇到的最大技术挑战是什么？是如何解决的？

**参考答案：**
最大的挑战是 **MCP 工具调用的延迟与稳定性**。
起初，高德地图的 MCP 调用偶尔会超时，导致整个行程规划失败。
**解决过程**：
1.  我首先增加了详细的 `latency_ms` 埋点，定位到是网络波动导致的。
2.  其次，我在 `model_router` 中增加了重试机制。
3.  最后，我优化了 Prompt，让 LLM 在一次调用中尽可能批量获取多个 POI 的信息，减少了往返交互次数（Round-trips）。

---

## 💡 面试加分项提示

1.  **强调“结构化输出”**：工业软件非常看重数据的准确性。多提你如何使用 Pydantic (`BaseModel`) 来强制约束 LLM 的输出格式。
2.  **提及“可解释性”**：说明你的系统不仅给出结果，还记录了 `reasoning`（推理过程）和 `tool_calls`（工具调用日志），这对于工业用户排查问题至关重要。
3.  **展示“全栈视野”**：你不仅懂 Python AI，还了解 Java 后端如何通过 Redis Stream 与 AI 交互，以及前端如何展示实时进度。这种端到端的交付能力在实习中非常宝贵。
