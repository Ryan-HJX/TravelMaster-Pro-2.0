# TravelMaster -AI 智能旅游规划 Agent

#### 介绍
一个多 Agent 协作系统，支持用户通过自然语言生成结构化的旅游行程单（景点+美食）。

#### 软件架构
本项目采用现代化的微服务架构，核心组件包括：
- **前端 (Frontend)**: React + TypeScript + Tailwind CSS，提供现代化的用户交互界面。
- **后端网关 (Backend)**: Java Spring Boot 3 (WebFlux)，负责业务逻辑、持久化及 API 转发。
- **Agent 核心 (Python)**: FastAPI + LangGraph，实现 Planner、Researcher、Validator、Generator 多 Agent 协作。
- **数据库**: H2 (Java侧) 与 SQLite (Python侧) 协同工作，支持行程持久化与历史记录查询。

#### 更新日志
- **v1.1**: 修复前端刷新后历史记录丢失问题（引入 localStorage）；优化 AI 规划细节度，强制 LLM 输出具体地标与店铺名；解决地点混淆问题，增强 Prompt 约束力。


#### 安装教程

1.  xxxx
2.  xxxx
3.  xxxx

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
