# TravelMaster Performance Test Suite

TravelMaster Pro 的性能测试脚本套件，包含 k6 压测脚本和 JMeter 测试计划。

## 环境要求

### k6 测试
- [k6](https://k6.io/docs/getting-started/installation/) 已安装
- TravelMaster 后端已启动（默认 `http://localhost:8080`）
- MySQL + Redis 已启动

### JMeter 测试
- [JMeter](https://jmeter.apache.org/download_jmeter.cgi) 5.6+ 已安装

## k6 测试脚本

### 运行方式

```bash
# 登录压测：200 VU，持续 30s
k6 run login-stress.js

# Feed 浏览 + 互动：500 VU，持续 30s
k6 run feed-interaction.js

# 任务提交 + 限流验证：50 VU，持续 30s
k6 run task-submit.js

# 综合 API 压测：递增 VU，模拟真实混合负载
k6 run api-comprehensive.js

# 健康检查：5 VU，持续 1m
k6 run health-check.js

# 指定自定义 base URL
k6 run -e BASE_URL=http://your-host:8080 login-stress.js
```

### 测试场景

| 脚本 | 类型 | VU 数 | 持续时间 | 测试目标 |
|------|------|-------|---------|----------|
| `login-stress.js` | 压力测试 | 200 | 30s | 登录接口 QPS、P95 延迟、BCrypt 吞吐 |
| `feed-interaction.js` | 压力测试 | 500 | 30s | Feed 缓存命中率、点赞/收藏并发写 |
| `task-submit.js` | 压力测试 | 50 | 30s | 分布式锁幂等、限流 429 触发率、AI 任务投递 |
| `api-comprehensive.js` | 混合负载 | 50-300 | 9m | 全链路 API 压测，模拟真实用户行为分布 |
| `health-check.js` | 健康检查 | 5 | 1m | 健康端点可用性、响应时间 |

### 预期指标

| 指标 | 目标值 |
|------|-------|
| 登录 P95 | < 500ms |
| 登录失败率 | < 5% |
| Feed P95 | < 300ms（缓存命中时） |
| 综合 API P90 | < 400ms |
| 综合 API P95 | < 600ms |
| 综合 API P99 | < 1000ms |
| 健康检查 P95 | < 100ms |
| 任务提交 | 限流正常触发，无数据不一致 |

### 输出报告

```bash
# 输出 JSON 报告
k6 run --out json=results/login-stress.json login-stress.js

# 输出 CSV 报告
k6 run --out csv=results/feed-interaction.csv feed-interaction.js

# 输出到 InfluxDB + Grafana
k6 run --out influxdb=http://localhost:8086/k6 login-stress.js
```

## JMeter 测试

### 运行方式

```bash
# 图形化模式
jmeter -t TravelMaster-Perf-Test.jmx

# 命令行模式（无 GUI）
jmeter -n -t TravelMaster-Perf-Test.jmx -l results/jmeter-results.jtl -e -o results/dashboard

# 指定参数
jmeter -n -t TravelMaster-Perf-Test.jmx -JbaseUrl=http://your-host:8080 -JnumUsers=200 -Jduration=600
```

### 测试计划结构

| Thread Group | 线程数 | 目标 API |
|--------------|--------|----------|
| Login Stress Test | ${numUsers} | POST /api/auth/login |
| API Mixed Workload | ${numUsers} | GET /api/feed, GET /api/users/profile |
| Health Check | 5 | GET /api/health |

### 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| baseUrl | http://localhost:8080 | 目标服务地址 |
| numUsers | 100 | 并发用户数 |
| duration | 300 | 测试持续时间（秒） |

## 测试结果分析

### k6 报告解读

```bash
# 查看汇总报告
k6 run login-stress.js

# 关键指标解读
- http_req_duration: 请求持续时间分布
- login_fail_rate: 登录失败率
- vus: 虚拟用户数
- iterations: 完成的迭代次数
```

### JMeter 报告

运行后在 `results/` 目录生成：
- `summary-report-*.csv`: 汇总报告
- `aggregate-report-*.csv`: 聚合报告
- `dashboard/`: HTML 仪表盘（需使用 `-e -o` 参数）

## CI/CD 集成

```bash
# GitHub Actions 示例
k6 run --out json=results/load-test.json api-comprehensive.js

# 失败阈值检查
if [ $(cat results/load-test.json | jq '.metrics.http_req_duration.values["p(95)"]') -gt 600 ]; then
  echo "P95 latency exceeds threshold"
  exit 1
fi
```
