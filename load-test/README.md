# k6 Load Test Suite

TravelMaster Pro 的压测脚本，基于 [k6](https://k6.io/)。

## 环境要求

- [k6](https://k6.io/docs/getting-started/installation/) 已安装
- TravelMaster 后端已启动（默认 `http://localhost:8080`）
- MySQL + Redis 已启动

## 运行方式

```bash
# 登录压测：200 VU，持续 30s
k6 run login-stress.js

# Feed 浏览 + 互动：500 VU，持续 30s
k6 run feed-interaction.js

# 任务提交 + 限流验证：50 VU，持续 30s
k6 run task-submit.js

# 指定自定义 base URL
k6 run -e BASE_URL=http://your-host:8080 login-stress.js
```

## 测试场景

| 脚本 | VU 数 | 持续时间 | 测试目标 |
|------|-------|---------|---------|
| `login-stress.js` | 200 | 30s | 登录接口 QPS、P95 延迟、BCrypt 吞吐 |
| `feed-interaction.js` | 500 | 30s | Feed 缓存命中率、点赞/收藏并发写 |
| `task-submit.js` | 50 | 30s | 分布式锁幂等、限流 429 触发率 |

## 预期指标

| 指标 | 目标值 |
|------|-------|
| 登录 P95 | < 500ms |
| 登录失败率 | < 5% |
| Feed P95 | < 300ms（缓存命中时） |
| 任务提交 | 限流正常触发，无数据不一致 |

## 输出报告

```bash
# 输出 JSON 报告
k6 run --out json=results/login-stress.json login-stress.js

# 输出 CSV 报告
k6 run --out csv=results/feed-interaction.csv feed-interaction.js
```
