# TravelMaster Kubernetes Deployment

TravelMaster 的 Kubernetes 部署配置文件。

## 目录结构

```
k8s/
├── travelmaster-backend-deployment.yml  # 后端部署配置
├── travelmaster-backend-service.yml     # 后端服务配置
├── travelmaster-frontend-deployment.yml # 前端部署配置
├── travelmaster-frontend-service.yml    # 前端服务配置
├── mysql-statefulset.yml                # MySQL StatefulSet
├── redis-deployment.yml                 # Redis 部署配置
├── hpa.yml                              # 水平自动扩缩容配置
├── ingress.yml                          # Ingress 配置
└── README.md
```

## 部署资源概览

| 资源 | 类型 | 副本数 |
|------|------|--------|
| travelmaster-backend | Deployment | 3 (可扩展至10) |
| travelmaster-frontend | Deployment | 3 (可扩展至10) |
| mysql | StatefulSet | 1 |
| redis | Deployment | 1 |
| travelmaster-backend | Service | ClusterIP |
| travelmaster-frontend | Service | ClusterIP |
| mysql | Service | ClusterIP |
| redis | Service | ClusterIP |

## 部署步骤

### 1. 创建命名空间

```bash
kubectl create namespace travelmaster
```

### 2. 创建 Secrets

```bash
kubectl create secret generic db-secret \
  --namespace=travelmaster \
  --from-literal=root-password=your-root-password \
  --from-literal=username=travelmaster \
  --from-literal=password=your-db-password

kubectl create secret generic jwt-secret \
  --namespace=travelmaster \
  --from-literal=secret=your-jwt-secret-key

kubectl create secret generic ai-secret \
  --namespace=travelmaster \
  --from-literal=api-key=your-ai-api-key

kubectl create secret tls travelmaster-tls \
  --namespace=travelmaster \
  --key=./tls/travelmaster.com.key \
  --cert=./tls/travelmaster.com.crt
```

### 3. 部署基础服务

```bash
kubectl apply -f redis-deployment.yml
kubectl apply -f mysql-statefulset.yml
```

### 4. 部署后端和前端

```bash
kubectl apply -f travelmaster-backend-deployment.yml
kubectl apply -f travelmaster-backend-service.yml
kubectl apply -f travelmaster-frontend-deployment.yml
kubectl apply -f travelmaster-frontend-service.yml
```

### 5. 部署 Ingress

```bash
kubectl apply -f ingress.yml
```

### 6. 部署 HPA (可选)

```bash
kubectl apply -f hpa.yml
```

## 环境变量配置

### 后端环境变量

| 变量 | 说明 | 来源 |
|------|------|------|
| SPRING_PROFILES_ACTIVE | Spring配置文件 | 固定值: prod |
| SPRING_DATASOURCE_URL | 数据库连接URL | 固定值 |
| SPRING_DATASOURCE_USERNAME | 数据库用户名 | db-secret |
| SPRING_DATASOURCE_PASSWORD | 数据库密码 | db-secret |
| SPRING_REDIS_HOST | Redis主机 | 固定值: redis |
| SPRING_REDIS_PORT | Redis端口 | 固定值: 6379 |
| JWT_SECRET | JWT密钥 | jwt-secret |
| AI_API_KEY | AI服务API密钥 | ai-secret |

### 前端环境变量

| 变量 | 说明 | 值 |
|------|------|------|
| REACT_APP_API_URL | API服务地址 | http://api.travelmaster.com |
| REACT_APP_WS_URL | WebSocket地址 | ws://api.travelmaster.com |

## 资源配置

### 后端容器
- CPU: 250m - 500m
- Memory: 512Mi - 1024Mi

### 前端容器
- CPU: 100m - 250m
- Memory: 256Mi - 512Mi

### MySQL容器
- CPU: 500m - 1
- Memory: 1Gi - 2Gi

### Redis容器
- CPU: 250m - 500m
- Memory: 512Mi - 1Gi

## 健康检查

### Liveness Probe
- 后端: /api/health, 延迟60s, 间隔10s
- 前端: /, 延迟30s, 间隔10s
- MySQL: mysqladmin ping, 延迟30s, 间隔10s
- Redis: redis-cli ping, 延迟10s, 间隔5s

### Readiness Probe
- 后端: /api/health, 延迟30s, 间隔5s
- 前端: /, 延迟15s, 间隔5s
- MySQL: SELECT 1, 延迟15s, 间隔5s
- Redis: redis-cli ping, 延迟5s, 间隔3s

## 水平自动扩缩容

### 后端HPA
- 最小副本: 3
- 最大副本: 10
- CPU阈值: 70%
- 内存阈值: 75%

### 前端HPA
- 最小副本: 3
- 最大副本: 10
- CPU阈值: 70%
- 内存阈值: 75%

## 网络配置

### Ingress规则
| 域名 | 路径 | 后端服务 |
|------|------|----------|
| api.travelmaster.com | / | travelmaster-backend:8080 |
| travelmaster.com | / | travelmaster-frontend:80 |

### TLS配置
- 证书: travelmaster-tls
- 支持域名: travelmaster.com, api.travelmaster.com

## 部署验证

```bash
# 检查Pod状态
kubectl get pods -n travelmaster

# 检查服务状态
kubectl get services -n travelmaster

# 检查Ingress状态
kubectl get ingress -n travelmaster

# 检查HPA状态
kubectl get hpa -n travelmaster

# 查看日志
kubectl logs -n travelmaster deployment/travelmaster-backend
```

## 清理

```bash
kubectl delete namespace travelmaster
```