# 🎯 OptiSchema MVP

An AI-assisted database tuning service that monitors PostgreSQL workloads, identifies performance bottlenecks, and delivers actionable, one-click fixes with projected cost/latency savings.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- OpenAI API Key
- Git

### Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd optischema
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

3. **Start the development stack**
   ```bash
   make dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## 🏗️ Architecture

### Backend (Python 3.12 + FastAPI)
- **Database Poller**: Monitors `pg_stat_statements` every 30 seconds
- **Analysis Engine**: Uses `pandas` + `sqlglot` + GPT-4o for query optimization
- **Real-time Communication**: WebSocket server for live updates

### Frontend (Next.js 14 + Tailwind + ShadCN)
- **Live Dashboard**: Real-time performance metrics and heatmap
- **Interactive Modals**: AI-powered recommendations with apply functionality
- **WebSocket Integration**: Real-time updates without page refresh

### Infrastructure (Docker Compose)
- **PostgreSQL 14**: Main database with `pg_stat_statements` extension
- **API Service**: FastAPI backend container
- **UI Service**: Next.js frontend container
- **Optional Sandbox**: Isolated PostgreSQL instance for testing patches

## 📊 Features

### Real-time Monitoring
- Continuous PostgreSQL query performance tracking
- Automatic identification of hot queries
- Execution plan analysis and bottleneck detection

### AI-Powered Analysis
- GPT-4o integration for plain-English explanations
- Intelligent query rewrite suggestions
- Strategic index recommendations

### One-Click Optimization
- Safe sandbox environment for testing patches
- Cost-benefit projections for each optimization
- Confidence scoring for recommendations

## 🛠️ Development

### Project Structure
```
optischema/
├── backend/          # FastAPI application
├── frontend/         # Next.js application
├── scripts/          # Demo and utility scripts
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

### Available Commands
- `make dev` - Start development stack with hot-reload
- `make demo` - Seed demo data and start the application
- `make clean` - Stop and clean all containers
- `make logs` - View logs from all services

### Development Workflow
1. **Backend Development**: Edit files in `backend/` - auto-reloads
2. **Frontend Development**: Edit files in `frontend/` - auto-reloads
3. **Database Changes**: Use `make demo` to reset with fresh data

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o
- `UI_WS_URL` - WebSocket URL for real-time updates
- `POSTGRES_PASSWORD` - PostgreSQL password

### API Endpoints
- `GET /health` - Health check
- `GET /metrics/raw` - Raw query metrics
- `GET /suggestions/latest` - Latest optimization suggestions
- `POST /suggestions/apply` - Apply optimization in sandbox
- `WS /ws` - WebSocket for real-time updates

## 📈 Performance Metrics

### Technical Targets
- **API Response Time**: < 100ms
- **Real-time Updates**: < 2s latency
- **AI Response Time**: < 5s
- **Dashboard Load Time**: < 3s

### Quality Targets
- **Recommendation Accuracy**: > 80%
- **Apply Success Rate**: > 95%
- **System Uptime**: > 99%

## 🧪 Demo

Run the demo to see OptiSchema in action:

```bash
make demo
```

This will:
1. Start all services
2. Seed the database with sample data
3. Generate intentional performance bottlenecks
4. Show the system identifying and suggesting optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `make dev`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or issues:
1. Check the documentation in `/docs`
2. Review the API documentation at `http://localhost:8000/docs`
3. Open an issue on GitHub

---

**OptiSchema** - Making PostgreSQL optimization accessible to everyone. 🚀 