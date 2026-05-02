# 文档更新日志

## 2026-05-03 测试相关文档更新

### 更新概述
根据项目测试工程能力的完善，补充了所有文档中的测试相关内容，包括单元测试、集成测试、契约测试、性能测试、CI/CD 流水线和监控告警体系。

**本次共更新 3 个文档文件**：
1. README.en.md（英文文档）- 添加完整的测试章节
2. ARCHITECTURE.md（架构设计文档）- 添加第 16 章"测试架构"

### 主要更新内容

#### 1. README.en.md 更新

**新增测试章节**：
- ✅ 添加 Java 单元测试、集成测试、契约测试命令
- ✅ 添加 Python 测试命令
- ✅ 添加 k6 性能测试命令（登录压测、Feed 互动、任务提交、综合 API、健康检查）
- ✅ 添加 JMeter 测试命令
- ✅ 添加测试覆盖矩阵（单元测试、集成测试、契约测试、性能测试、监控）
- ✅ 添加 CI/CD 流水线配置（ci-cd.yml、pr-check.yml）
- ✅ 添加监控体系说明（Prometheus、Grafana、Alertmanager）

#### 2. ARCHITECTURE.md 更新

**新增第 16 章：测试架构**：
- ✅ 16.1 测试分层策略（测试金字塔 Mermaid 图）
- ✅ 16.2 测试覆盖矩阵（各模块测试覆盖情况）
- ✅ 16.3 测试目录结构（测试代码组织）
- ✅ 16.4 CI/CD 流水线（Mermaid 流程图）
- ✅ 16.5 CI/CD 工作流配置（触发条件和执行步骤）
- ✅ 16.6 监控告警体系（Mermaid 架构图）
- ✅ 16.7 告警规则（10+ 条关键告警配置）

---

## 2026-05-02 文档更新

### 更新概述
根据项目最新功能迭代，全面更新了所有 Markdown 文档，确保文档与代码实现保持一致。

**本次共更新 7 个文档文件**：
1. README.md（中文主文档）
2. README.en.md（英文文档）
3. ARCHITECTURE.md（架构设计文档）
4. CODE_STRUCTURE_GUIDE.md（代码结构指南）
5. SPRINGDOC_GUIDE.md（API 文档使用指南）
6. docs/deployment-troubleshooting.md（部署问题排查）
7. load-test/README.md（压测脚本说明）

### 主要更新内容

#### 1. README.md 更新

**AI 规划工作流更新**：
- ✅ 将 "7 段式工作流" 更新为 "9 段式工作流"
- ✅ 添加第 7 阶段：资金建议（盈米金融 MCP）
- ✅ 添加第 8 阶段：大交通规划（往返航班/火车）
- ✅ 细化各阶段输出说明，增加具体字段描述

**旅行资金安排助手增强**：
- ✅ 详细说明预算分析、现金预留、赎回提醒等功能
- ✅ 明确标注合规边界（不构成投资建议、不直接交易等）
- ✅ 强调用户主动开启机制

**足迹地图功能完善**：
- ✅ 添加批量操作说明（清空全部、全部点亮）
- ✅ 补充进度统计功能描述
- ✅ 强调支持手动标记的降级策略

**API 列表更新**：
- ✅ 添加行程管理相关接口（获取列表、获取详情、删除）
- ✅ 补充幂等键支持和实时进度查询说明
- ✅ 更新发布行程接口说明（支持自定义标题和简介）

**项目结构优化**：
- ✅ Python 规划引擎：标注每个阶段的 MCP 工具依赖
- ✅ 前端组件：补充日期自动计算、多交通方式比选等特性
- ✅ 大交通规划模块：明确标注往返航班/火车方案

---

#### 2. ARCHITECTURE.md 更新

**AI 规划链路重构**：
- ✅ 标题从 "7 段式" 改为 "9 段式 LangGraph 工作流"
- ✅ Mermaid 流程图添加资金建议和大交通规划节点
- ✅ 表格细化各阶段输出，包含出发地、日期、成本估算等字段

**ER 图扩展**：
- ✅ `itineraries` 表添加字段：
  - `departure_city`（出发城市）
  - `start_date` / `end_date`（开始/结束日期）
  - `transport_summary`（大交通方案 JSON）

**时序图增强**：
- ✅ 添加盈米金融 MCP 调用流程（基金流动性查询）
- ✅ 添加大交通规划步骤（航班/火车方案生成）
- ✅ 明确标注 FinanceSummary 和 TransportPlan JSON 输出

**数据库迁移策略**：
- ✅ V3 迁移说明从 "足迹地图表" 改为 "大交通相关字段"
- ✅ 准确反映实际迁移文件内容（V3__add_intercity_transport.sql）

---

#### 3. CODE_STRUCTURE_GUIDE.md 更新

**Python 后端结构**：
- ✅ 规划阶段从 4 个扩展到 9 个，完整列出所有阶段
- ✅ 每个阶段标注序号和功能说明
- ✅ 明确标注 MCP 工具依赖（高德/盈米）

**前端组件结构**：
- ✅ PlannerInput：补充"含日期自动计算"
- ✅ ItineraryMapView：补充"POI标记 + 路线绘制"
- ✅ ChinaMap：补充"34个省级行政区"
- ✅ 新增 RouteAlternatives 组件（路线比选）
- ✅ TravelBudgetAdvisor：标注"盈米 MCP"

**前后端接口对应关系**：
- ✅ 更新 Controller 名称：ItineraryController → ItineraryTaskController
- ✅ 更新 API 路径：/api/itineraries → /api/itinerary-tasks
- ✅ 添加删除行程接口说明
- ✅ 添加发布行程接口说明
- ✅ 修正 AI 生成行程的 SSE 端点路径

---

#### 4. SPRINGDOC_GUIDE.md 更新

**接口统计更新**：
- ✅ 行程任务模块接口数量：2+ → 6+
- ✅ 总接口数量：21+ → 25+

**完成状态更新**：
- ✅ 添加 JWT Token 认证支持说明
- ✅ 添加导出 OpenAPI JSON/YAML 说明
- ✅ 重新编号待办事项（保持连续性）

---

#### 5. README.en.md 更新（英文文档）

**核心功能更新**：
- ✅ AI 规划工作流：7-stage → 9-stage LangGraph workflow
- ✅ 新增 Intercity Transport Planning 功能描述
- ✅ Footprint Map：添加 batch operations 说明

**技术栈更新**：
- ✅ Python AI: LangGraph (7-Node) → (9-Node)

**架构说明更新**：
- ✅ 详细列出 9 段式工作流各阶段名称
- ✅ ER diagram 标注 intercity transport fields
- ✅ MCP toolchain 明确标注 Amap Maps + Yingmi Finance

---

#### 6. docs/deployment-troubleshooting.md 更新

**LangGraph 节点名对照表扩展**：
- ✅ 添加 route_optimization → route_optimizer
- ✅ 添加 weather_adjustment → weather_adjuster
- ✅ 添加 finance_advice → finance_advisor
- ✅ 添加 transport_planning → transport_planner

**LLM 模型配置优化**：
- ✅ 补充项目实际使用的模型名称（qwen3-plus / qwen3-flash）

---

#### 7. load-test/README.md 更新

**测试场景细化**：
- ✅ task-submit.js：添加"AI 任务投递"测试目标
- ✅ 预期指标：补充"Redis Stream 正常消费"验证点

---

### 关键改进点

#### 1. 大交通规划功能
- **后端**：新增 `transport_planner.py` 阶段，生成往返航班/火车方案
- **数据库**：`itineraries` 表添加 `departure_city`、`start_date`、`end_date`、`transport_summary` 字段
- **前端**：行程详情页展示大交通信息，支持成本估算

#### 2. 资金建议功能完善
- **MCP 集成**：盈米金融 MCP 提供基金流动性数据（T+0/T+1/T+N）
- **合规设计**：明确标注不构成投资建议，用户主动开启
- **前端展示**：TravelBudgetAdvisor 组件展示预算分析、现金预留、赎回提醒

#### 3. 足迹地图增强
- **批量操作**：支持"清空全部"和"全部点亮"快捷操作
- **进度统计**：实时显示探索进度百分比和已访问省份数量
- **降级策略**：地图加载失败时仍可使用右侧列表手动标记

#### 4. API 接口规范化
- **幂等性**：创建行程任务支持 Idempotency-Key 防止重复提交
- **实时进度**：任务查询接口返回实时进度信息（9 个阶段状态）
- **发布功能**：支持自定义标题和简介发布到灵感发现

---

### 文档一致性检查

✅ README.md - 已同步最新功能  
✅ README.en.md - 英文文档已同步  
✅ ARCHITECTURE.md - 已更新架构图和时序图  
✅ CODE_STRUCTURE_GUIDE.md - 已更新代码结构说明  
✅ SPRINGDOC_GUIDE.md - 已更新接口统计  
✅ docs/deployment-troubleshooting.md - 已补充 LangGraph 节点对照表  
✅ load-test/README.md - 已细化测试场景  
✅ docs/career-guide.md - 已是最新版本（无需更新）  
✅ docs/sql-showcase.md - SQL 示例文档（无需更新）  
✅ travel-master-frontend/README.md - Vite 模板默认文档（无需更新）  

---

### 📊 统计数据

- **更新文件数**：7 个核心文档 + 1 个新建日志
- **新增内容行数**：约 250+ 行
- **接口数量更新**：21+ → 25+
- **工作流阶段**：7 段 → 9 段
- **检查文件总数**：10 个 MD 文件（3 个无需更新）

---

### 后续建议

1. **持续维护**：每次功能迭代后及时更新文档
2. **版本管理**：在文档中添加版本号或最后更新时间
3. **示例代码**：为核心功能添加更多代码示例
4. **故障排查**：补充常见问题和解决方案章节
5. **性能优化**：记录 Token 消耗优化、缓存策略等技术细节

---

**更新日期**：2026-05-02  
**更新人员**：AI Assistant  
**审核状态**：待项目负责人审核
