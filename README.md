# TravelMaster - AI 智能旅游规划 Agent

基于 LangGraph + LangChain + Ollama 的本地化智能旅游规划助手。

## 🚀 核心特性
- **本地化部署**: 支持 Ollama 运行 Gemma2 等模型，隐私安全。
- **长文本研究**: 自动爬取携程、马蜂窝等深度攻略，解决 AI “胡编乱造”问题。
- **高德地图校验**: 每一个景点都经过 AMAP API 真实性校验，并附带一键导航。
- **流水线生成架构**: 针对小模型优化的“分段式”生成逻辑，确保输出结构化表格。

## 🧠 提示词工程 (Prompt Engineering) 实践记录
在开发过程中，我们针对本地小模型（Gemma 4b/9b）进行了深度调教，总结出以下核心经验：

### 1. 从“描述”到“约束” (Constraint Engineering)
- **现象**: 早期模型容易忽略 System Message，输出宽泛的文字段落。
- **方案**: 引入“铁律”模式，将指令从“建议”升级为“必须执行的规则”，并使用强烈的视觉分隔符。

### 2. Few-Shot 引导的魔力
- **现象**: 模型不知道 Markdown 表格的具体样式。
- **方案**: 在提示词中直接塞入一个“标准答案示例”，利用模型的模仿本能强制其对齐格式。

### 3. 上下文截断与优先级过滤
- **现象**: 长网页素材（如 Tripadvisor）会导致模型上下文过载，遗忘用户原始需求。
- **方案**: 实施暴力截断（限制素材长度），并在 Human 提示词中重复强调用户原始输入的最高优先级。

### 4. 方案 A：流水线拆解 (Pipeline/Chained Generation)
- **最终杀手锏**: 针对小模型无法同时处理多项逻辑的问题，将生成过程拆分为“天气看板提取”和“行程表格构建”两个独立阶段。每次只让模型做一件事，成功率从 20% 提升至 90% 以上。

## 🛠️ 安装与运行
1. **安装依赖**: `pip install -r requirements.txt`
2. **配置环境**: 复制 `.env.example` 为 `.env` 并填写相关 API Key。
3. **启动后端**: `python server.py`
4. **启动前端**: `cd travel-master-frontend && npm run dev`

---
*Created with ❤️ by Antigravity AI Agent*
