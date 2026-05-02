# TravelMaster Monitoring

TravelMaster 的监控告警体系配置，基于 Prometheus + Grafana + Alertmanager。

## 监控架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Grafana Dashboard                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ Requests│ │ Latency │ │  Memory │ │   CPU   │ │ DB Conn │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Prometheus                                │
│  - 采集指标                                                     │
│  - 告警规则评估                                                  │
│  - 数据存储                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ▲
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────┴───────┐    ┌────────┴────────┐   ┌────────┴────────┐
│   Backend     │    │     MySQL      │   │     Redis       │
│  (Actuator)   │    │ (Exporter)     │   │ (Exporter)      │
└───────────────┘    └─────────────────┘   └─────────────────┘
```

## 目录结构

```
monitoring/
├── prometheus.yml          # Prometheus 配置
├── alertmanager.yml        # Alertmanager 配置
├── rules/
│   └── travelmaster-alerts.yml  # 告警规则
├── grafana-dashboard.json  # Grafana 仪表盘
└── README.md
```

## 告警规则

| 告警名称 | 严重级别 | 触发条件 |
|----------|----------|----------|
| HighErrorRate | critical | 5xx错误率 > 5% |
| HighLatency | warning | P95延迟 > 2s |
| ServiceUnavailable | critical | 服务宕机 > 30s |
| HighMemoryUsage | warning | JVM堆内存 > 85% |
| HighCPUUsage | warning | CPU使用率 > 80% |
| DatabaseConnectionPoolHigh | warning | 数据库连接池 > 80% |
| RedisDown | critical | Redis不可用 |
| MySQLDown | critical | MySQL不可用 |
| LoginRateAnomaly | warning | 登录请求 > 100/s |
| TaskQueueBacklog | critical | Redis Stream积压 > 1000 |

## 部署方式

### Docker Compose

```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/rules:/etc/prometheus/rules
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    environment:
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
      - SMTP_PASSWORD=${SMTP_PASSWORD}

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
```

### Kubernetes

```bash
kubectl apply -f k8s/prometheus-deployment.yml
kubectl apply -f k8s/grafana-deployment.yml
kubectl apply -f k8s/alertmanager-deployment.yml
```

## 环境变量

| 变量 | 说明 |
|------|------|
| SLACK_WEBHOOK_URL | Slack告警通知Webhook |
| SMTP_PASSWORD | 邮件告警SMTP密码 |
| GRAFANA_PASSWORD | Grafana管理员密码 |

## 使用指南

### 启动监控

```bash
# 启动Prometheus
docker run -p 9090:9090 -v $(pwd)/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus

# 启动Alertmanager
docker run -p 9093:9093 -v $(pwd)/monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml -e SLACK_WEBHOOK_URL=xxx prom/alertmanager

# 启动Grafana
docker run -p 3000:3000 -e GF_SECURITY_ADMIN_PASSWORD=admin grafana/grafana
```

### 导入仪表盘

1. 登录 Grafana (http://localhost:3000)
2. 进入 Dashboards -> Import
3. 上传 `grafana-dashboard.json` 文件

## 指标说明

### HTTP指标
- `http_requests_total`: 总请求数
- `http_request_duration_seconds_bucket`: 请求延迟分布
- `http_requests_total{status="5xx"}`: 5xx错误数

### JVM指标
- `jvm_memory_used_bytes{area="heap"}`: 堆内存使用
- `jvm_memory_max_bytes{area="heap"}`: 堆内存最大值
- `process_cpu_usage`: CPU使用率

### 数据库指标
- `hikaricp_connections_active`: 活跃连接数
- `hikaricp_connections_max`: 最大连接数

### Redis指标
- `redis_stream_pending_entries`: Stream待处理消息数