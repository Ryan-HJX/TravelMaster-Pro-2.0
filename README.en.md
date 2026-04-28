# TravelMaster Pro 2.0 - AI-Powered Smart Travel Planning Platform

#### Description
An intelligent travel social platform driven by cloud AI, featuring dynamic itinerary planning with real geographic constraints. Built with Java Spring Boot + Python FastAPI + Alibaba Cloud Bailian MCP.

#### Key Features
- **AI Itinerary Planning**: 7-stage LangGraph workflow with qwen3-plus/flash models
- **MCP Tool Integration**: Amap Maps (geocoding/POI/routing/weather) + Yingmi Finance (budget planning)
- **Real-time Progress Tracking**: Redis-based progress updates with WebSocket notifications
- **Footprint Map**: ECharts-powered provincial-level map covering 34 administrative regions
- **Social Features**: Posts, likes, favorites, comments, follows with two-tier caching
- **Model Fallback**: Cloud-first strategy with local Ollama fallback

#### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Java Backend** | Spring Boot 3.2 · Spring Security · JPA · Flyway · WebSocket |
| **Python AI** | FastAPI · LangGraph (7-Node) · Bailian Responses API · MCP |
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

#### Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design, including:
- Layered architecture diagram
- 7-stage AI planning workflow
- ER diagram
- Sequence diagrams
- MCP toolchain
- Caching & rate limiting strategies
- Database migration history

#### Contribution

1. Fork the repository
2. Create Feat_xxx branch
3. Commit your code
4. Create Pull Request

#### License

MIT
