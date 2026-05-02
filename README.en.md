# TravelMaster Pro 2.0 - AI-Powered Smart Travel Planning Platform

#### Description
An intelligent travel social platform driven by cloud AI, featuring dynamic itinerary planning with real geographic constraints. Built with Java Spring Boot + Python FastAPI + Alibaba Cloud Bailian MCP.

#### Key Features
- **AI Itinerary Planning**: 9-stage LangGraph workflow with qwen3-plus/flash models
- **MCP Tool Integration**: Amap Maps (geocoding/POI/routing/weather) + Yingmi Finance (budget planning)
- **Intercity Transport Planning**: Round-trip flight/train recommendations with cost estimation
- **Real-time Progress Tracking**: Redis-based progress updates with WebSocket notifications
- **Footprint Map**: ECharts-powered provincial-level map covering 34 administrative regions with batch operations
- **Social Features**: Posts, likes, favorites, comments, follows with two-tier caching
- **Model Fallback**: Cloud-first strategy with local Ollama fallback

#### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Java Backend** | Spring Boot 3.2 · Spring Security · JPA · Flyway · WebSocket |
| **Python AI** | FastAPI · LangGraph (9-Node) · Bailian Responses API · MCP |
| **Cloud Models** | qwen3-plus (main reasoning) · qwen3-flash (lightweight extraction) |
| **Local Fallback** | Ollama gemma4:e2b |
| **Data** | MySQL 8.0 · Redis 7 (Stream / Cache / Lock / Rate Limit) |
| **Frontend** | React 19 · TypeScript · Vite · ECharts · Amap JS API |
| **Infrastructure** | Docker Compose · Nginx · k6 Load Testing |

#### Installation

```bash
# Clone repository
git clone <repo-url> && cd TravelMaster

# Configure environment variables
cp .env.example .env
# Fill in required API keys:
# DASHSCOPE_API_KEY, AMAP_API_KEY, YINGMI_API_KEY

# Start all services
docker-compose up --build
```

#### Access URLs

- **Frontend**: http://localhost
- **API**: http://localhost/api
- **AI Docs**: http://localhost/ai/docs

#### Local Development

```bash
# 1. Start dependencies
docker-compose up mysql redis -d

# 2. Java Backend
cd travel-master-backend && mvn spring-boot:run

# 3. Python AI
cd .. && pip install -r requirements.txt && python main.py

# 4. Frontend
cd travel-master-frontend && npm install && npm run dev
```

#### Testing

```bash
# Java Unit Tests + Integration Tests + Contract Tests
cd travel-master-backend && mvn test

# Python Tests
python -m pytest src/tests -q

# k6 Load Testing
k6 run load-test/login-stress.js           # Login stress test
k6 run load-test/feed-interaction.js      # Feed browsing + interactions
k6 run load-test/task-submit.js           # Task submission + rate limiting
k6 run load-test/api-comprehensive.js     # Comprehensive API load test
k6 run load-test/health-check.js          # Health check load test

# JMeter Testing
jmeter -n -t load-test/TravelMaster-Perf-Test.jmx -l results/jmeter-results.jtl
```

**Test Coverage:**

| Test Type | Tools | Coverage |
|-----------|-------|----------|
| Unit Tests | JUnit 5 + Mockito | Auth, User, Itinerary, Social, Security modules |
| Integration Tests | Spring Test + H2 | Database operations, transaction handling |
| Contract Tests | Rest-Assured | API request/response contract verification |
| Load Testing | k6 + JMeter | Login, Feed, Task submission scenarios |
| Monitoring | Prometheus + Grafana | HTTP requests, JVM, Database, Redis metrics |

**CI/CD Pipeline:**

| Workflow | Trigger | Main Steps |
|----------|---------|------------|
| `ci-cd.yml` | push/PR to main/develop | Build → Unit Tests → Security Scan → Performance Test → Docker Build → K8s Deployment |
| `pr-check.yml` | PR to main/develop | Code Format Check → SonarQube Analysis → Dependency Security Check |

**Monitoring:**
- **Prometheus**: Metrics collection (HTTP requests, JVM memory, database connections, Redis Stream)
- **Grafana**: Visualization dashboard (request volume, error rate, P95 latency, memory usage)
- **Alertmanager**: Alert notifications (Slack, Email)

#### Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design, including:
- Layered architecture diagram
- 9-stage AI planning workflow (intent → geo grounding → POI selection → route optimization → weather adjustment → scoring → finance advice → transport planning → rendering)
- ER diagram with intercity transport fields
- Sequence diagrams
- MCP toolchain (Amap Maps + Yingmi Finance)
- Caching & rate limiting strategies
- Database migration history

#### Contribution

1. Fork the repository
2. Create Feat_xxx branch
3. Commit your code
4. Create Pull Request

#### License

MIT
