# TravelMaster - AI 智能旅游规划 Agent

#### 介绍
TravelMaster 是一款基于多 Agent 协作的智能化旅游规划平台。它能够通过自然语言理解用户的旅行需求，并利用实时互联网搜索与地图 API 验证，生成**杜绝幻觉、真实可信**的结构化旅游行程单。

---

#### 🛠️ 技术栈
- **前端 (Frontend)**: 
  - React + TypeScript + Tailwind CSS
  - **高德地图 JS API**: 实现可视化路线规划、地图打点及自动缩放。
- **后端 (Backend)**: 
  - Java Spring Boot 3 (WebFlux)
  - **H2 Database**: 负责用户信息及历史行程的持久化存储。
- **Agent 核心 (Python)**: 
  - FastAPI + LangGraph + LangChain
  - **多 Agent 协作**: Planner (规划)、Researcher (研究)、Generator (生成)。
  - **深度搜索**: DuckDuckGo + Trafilatura (网页正文抓取)。
  - **地理验证**: 高德地图 Web 服务 API。

---

#### 🚀 核心功能与问题解决方案

| 遇到的问题 | 解决技术与策略 |
| :--- | :--- |
| **AI 幻觉/编造地点** | **POI 强校验**：接入高德地图 API，对所有提取到的地点进行真实性核对，查无此地直接剔除。 |
| **地点重名导致误报** | **城市感知校验**：搜索时强制携带城市前缀（如“延安 人民公园”），并严格比对 API 返回的 `cityname`。 |
| **搜索信息太浅/不准** | **深度网页抓取**：引入 `trafilatura`，对搜索结果前 10 个链接进行正文深度阅读，获取海量真实素材。 |
| **路线规划失效** | **动态路线绘制**：利用 AMap.Driving 插件自动计算途径点最优路径，并使用 `setFitView` 自动对焦。 |
| **交互体验不佳** | **UI/UX 升级**：采用毛玻璃风格，将导航按钮内嵌至景点名称旁，新增一键复制行程功能。 |

---

#### 📦 安装与配置

1.  **后端环境**:
    - 在 Python 根目录下创建 `.env` 文件。
    - 配置 `AMAP_API_KEY` (高德 Web 服务 Key) 和 `TAVILY_API_KEY` (可选)。
2.  **前端环境**:
    - 在 `src/components/MapViewer.tsx` 中填入您的高德 JS API Key 和安全密钥。
    - 运行 `npm install` 安装相关依赖。
3.  **启动**:
    - Python 端: `python server.py`
    - Java 端: 运行 Spring Boot 主类。
    - 前端: `npm run dev`

---

#### 📅 更新日志
- **v1.5**: 新增 10 链接深度网页抓取，信息量提升 10 倍。
- **v1.4**: 优化地图交互，支持不同类型 POI 图标（🏛️/🍴）与一键复制功能。
- **v1.3**: 彻底修复跨城地点误报，实现高德 API 极致严格校验。
- **v1.2**: 引入可视化地图路线规划，导航按钮内嵌，提升 UI 美感。

---

#### 🤝 参与贡献
1. Fork 本仓库
2. 新建 Feat_xxx 分支
3. 提交代码并推送至 Origin
4. 新建 Pull Request
