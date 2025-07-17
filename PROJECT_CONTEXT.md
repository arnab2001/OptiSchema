# 🎯 OptiSchema MVP - Project Context & Goals

## 📋 Project Overview

**OptiSchema** is an AI-assisted database tuning service that provides real-time PostgreSQL performance optimization. The system monitors database workloads, identifies performance bottlenecks, and delivers actionable, one-click fixes with projected cost/latency savings.

### Core Value Proposition
- **Real-time monitoring** of PostgreSQL query performance
- **AI-powered analysis** of execution plans and query patterns
- **Actionable recommendations** with one-click application
- **Cost-benefit projections** for each optimization

## 🏗️ High-Level Architecture

### 1. Backend (Python 3.12 + FastAPI)
- **Database Poller**: Continuously monitors `pg_stat_statements` for query performance metrics
- **Analysis Engine**: Runs `EXPLAIN (FORMAT JSON)` on high-cost queries and applies heuristics
- **AI Integration**: Uses OpenAI GPT-4o for plain-English explanations and SQL rewrites
- **Real-time Communication**: WebSocket server for live updates to frontend

### 2. Frontend (Next.js 14 + Tailwind + ShadCN)
- **Live Dashboard**: Real-time heatmap and performance metrics table
- **Interactive Modals**: AI-powered recommendations with apply functionality
- **WebSocket Integration**: Real-time updates without page refresh

### 3. Infrastructure (Docker Compose)
- **PostgreSQL 14**: Main database with `pg_stat_statements` extension
- **API Service**: FastAPI backend container
- **UI Service**: Next.js frontend container
- **Optional Sandbox**: Isolated PostgreSQL instance for testing patches

## 🎯 MVP Goals & Success Criteria

### Primary Objectives
1. **Real-time Monitoring**: Successfully poll and display PostgreSQL query metrics
2. **AI Analysis**: Generate meaningful optimization suggestions using GPT-4o
3. **One-click Application**: Apply optimizations in a sandbox environment
4. **Cost Projections**: Provide estimated performance improvements

### Technical Milestones
- [ ] **Monorepo Setup**: Clean project structure with Docker Compose
- [ ] **Database Integration**: Reliable connection to PostgreSQL with metrics collection
- [ ] **Analysis Pipeline**: Query fingerprinting, execution plan analysis, and heuristic detection
- [ ] **AI Integration**: OpenAI API integration for explanations and query rewrites
- [ ] **Real-time UI**: Live dashboard with WebSocket updates
- [ ] **Sandbox Environment**: Safe testing of optimization patches

## 📊 Key Features & Capabilities

### Database Monitoring
- **Query Performance Tracking**: Monitor execution time, call frequency, and resource usage
- **Hot Query Identification**: Automatically detect the most expensive queries
- **Execution Plan Analysis**: Deep dive into query execution strategies

### AI-Powered Analysis
- **Plain-English Explanations**: Convert technical execution plans into understandable insights
- **Query Rewrites**: Generate optimized SQL based on performance bottlenecks
- **Index Recommendations**: Suggest strategic index additions for performance gains

### User Experience
- **Live Dashboard**: Real-time visualization of database performance
- **Interactive Recommendations**: Click-to-apply optimization suggestions
- **Performance Projections**: Estimated improvements with confidence metrics

## 🔧 Technical Stack

### Backend
- **Language**: Python 3.12
- **Framework**: FastAPI
- **Database**: PostgreSQL 14 with `pg_stat_statements`
- **Async**: `asyncpg` for database operations
- **Analysis**: `pandas` + `sqlglot` for query processing
- **AI**: OpenAI GPT-4o API
- **Caching**: SQLite or `diskcache` for AI responses

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + ShadCN components
- **State Management**: SWR for data fetching
- **Real-time**: WebSocket integration
- **Charts**: `react-heatmap-grid` for performance visualization

### Infrastructure
- **Containerization**: Docker Compose
- **Development**: Hot-reload setup for both frontend and backend
- **Data**: Persistent PostgreSQL volume

## 🚀 Development Phases

### Phase 0: Foundation (Current)
- [ ] Monorepo scaffolding
- [ ] Development environment setup
- [ ] Docker Compose configuration
- [ ] Basic project structure

### Phase 1: Backend Core
- [ ] FastAPI application setup
- [ ] PostgreSQL connection and polling
- [ ] Query metrics collection
- [ ] Basic analysis engine

### Phase 2: AI Integration
- [ ] OpenAI API integration
- [ ] Execution plan analysis
- [ ] Query rewrite generation
- [ ] Response caching

### Phase 3: Frontend Development
- [ ] Next.js application setup
- [ ] Dashboard components
- [ ] Real-time WebSocket integration
- [ ] Interactive recommendation modals

### Phase 4: Sandbox & Polish
- [ ] Sandbox environment setup
- [ ] One-click apply functionality
- [ ] Performance projections
- [ ] Demo data and documentation

## 📈 Success Metrics

### Technical Metrics
- **Query Response Time**: < 100ms for API endpoints
- **Real-time Updates**: < 2s latency for WebSocket messages
- **AI Response Time**: < 5s for optimization suggestions
- **System Uptime**: > 99% during development

### User Experience Metrics
- **Dashboard Load Time**: < 3s initial load
- **Recommendation Quality**: > 80% accuracy in optimization suggestions
- **Apply Success Rate**: > 95% successful patch applications

## 🔍 Key Challenges & Considerations

### Technical Challenges
1. **Query Fingerprinting**: Reliable identification of similar queries across different parameters
2. **Execution Plan Analysis**: Accurate interpretation of PostgreSQL explain plans
3. **AI Prompt Engineering**: Effective prompts for consistent, actionable recommendations
4. **Real-time Performance**: Efficient WebSocket communication without overwhelming the client

### Business Considerations
1. **Cost Management**: OpenAI API usage optimization
2. **Scalability**: Architecture that can handle multiple database instances
3. **Security**: Safe handling of database credentials and AI API keys
4. **User Experience**: Intuitive interface for database administrators

## 📚 Reference Materials

### PostgreSQL Resources
- `pg_stat_statements` extension documentation
- `EXPLAIN` command reference
- Performance tuning best practices

### AI/ML Resources
- OpenAI GPT-4o API documentation
- Prompt engineering best practices
- Query optimization patterns

### Development Resources
- FastAPI documentation
- Next.js 14 features
- Docker Compose best practices
- WebSocket implementation patterns

---

## 🎯 Next Steps

1. **Immediate**: Set up monorepo structure and development environment
2. **Short-term**: Implement basic PostgreSQL polling and metrics collection
3. **Medium-term**: Integrate AI analysis and frontend dashboard
4. **Long-term**: Polish user experience and prepare for demo

This document will be updated as the project evolves and serves as our single source of truth for project goals, architecture decisions, and development priorities. 