# 🎯 OptiSchema - Project Context & Goals

## 📋 Project Overview

**OptiSchema** is an AI-assisted database tuning service that provides real-time PostgreSQL performance optimization. The system monitors database workloads, identifies performance bottlenecks, and delivers actionable, one-click fixes with projected cost/latency savings.

### Core Value Proposition
- **Real-time monitoring** of PostgreSQL query performance with intelligent filtering
- **Multi-model AI-powered analysis** of execution plans and query patterns
- **Actionable recommendations** with confidence scoring and risk assessment
- **Safe optimization testing** with sandbox environment and benchmarking

## 🏗️ High-Level Architecture

### 1. Backend (Python 3.12 + FastAPI)
- **Database Poller**: Continuously monitors `pg_stat_statements` with adaptive filtering for large datasets
- **Analysis Engine**: Multi-model AI integration (Gemini 2.0 Flash, DeepSeek Chat) for query optimization
- **Query Fingerprinting**: Intelligent query normalization and deduplication
- **Execution Plan Analysis**: Deep PostgreSQL explain plan parsing with bottleneck detection
- **Real-time Communication**: WebSocket server for live updates to frontend
- **Caching System**: SQLite-based caching for AI responses to reduce costs and improve performance

### 2. Frontend (Next.js 14 + TypeScript + Tailwind)
- **Live Dashboard**: Real-time performance metrics with responsive design
- **Interactive Query Analysis**: Detailed query breakdowns with execution plans
- **AI Recommendations**: Interactive modals with confidence scoring and benchmarks
- **Connection Management**: Database connection wizard with secure credential storage
- **Dark Mode Support**: Full dark/light theme support with keyboard navigation

### 3. Infrastructure (Docker Compose)
- **PostgreSQL 14**: Main database with `pg_stat_statements` extension
- **PostgreSQL Sandbox**: Isolated instance for safe optimization testing
- **API Service**: FastAPI backend container with hot-reload
- **UI Service**: Next.js frontend container with hot-reload

## 🎯 Current Status & Achievements

### ✅ **Completed Features**
1. **Real-time Monitoring**: Successfully polls and displays PostgreSQL query metrics
2. **Multi-model AI Analysis**: Generates meaningful optimization suggestions using Gemini and DeepSeek
3. **One-click Application**: Applies optimizations in a sandbox environment with benchmarking
4. **Cost Projections**: Provides estimated performance improvements with confidence scoring
5. **Advanced UI**: Professional dashboard with responsive design and interactive elements
6. **Connection Management**: Secure database connection wizard with credential storage
7. **Query Analysis**: Detailed execution plan analysis with bottleneck detection
8. **Performance Benchmarking**: Before/after performance comparison with rollback support

### 🔄 **Current Development Focus**
- **Performance Optimization**: Improving query analysis speed and accuracy
- **UI Enhancements**: Adding more interactive features and visualizations
- **Documentation**: Maintaining comprehensive guides and examples

## 📊 Key Features & Capabilities

### Database Monitoring
- **Query Performance Tracking**: Monitor execution time, call frequency, and resource usage
- **Hot Query Identification**: Automatically detect the most expensive queries with smart filtering
- **Execution Plan Analysis**: Deep dive into query execution strategies with bottleneck detection
- **Business Query Filtering**: Excludes system queries to focus on application performance

### AI-Powered Analysis
- **Multi-model Support**: Gemini 2.0 Flash and DeepSeek Chat for query optimization
- **Plain-English Explanations**: Convert technical execution plans into understandable insights
- **Query Rewrites**: Generate optimized SQL based on performance bottlenecks
- **Index Recommendations**: Suggest strategic index additions for performance gains
- **Confidence Scoring**: Risk assessment and confidence levels for each recommendation

### User Experience
- **Live Dashboard**: Real-time visualization of database performance
- **Interactive Recommendations**: Click-to-apply optimization suggestions with benchmarking
- **Performance Projections**: Estimated improvements with confidence metrics
- **Responsive Design**: Mobile-optimized interface with dark mode support
- **Keyboard Navigation**: Full keyboard support for power users

## 🔧 Technical Stack

### Backend
- **Language**: Python 3.12
- **Framework**: FastAPI with async/await patterns
- **Database**: PostgreSQL 14 with `pg_stat_statements`
- **Async**: `asyncpg` for database operations
- **Analysis**: Multi-model AI integration (Gemini, DeepSeek)
- **Caching**: SQLite-based caching for AI responses
- **Real-time**: WebSocket server for live updates

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with responsive design
- **State Management**: SWR for data fetching
- **Real-time**: WebSocket integration
- **UI Components**: Custom components with dark mode support
- **Accessibility**: Keyboard navigation and ARIA labels

### Infrastructure
- **Containerization**: Docker Compose
- **Development**: Hot-reload setup for both frontend and backend
- **Data**: Persistent PostgreSQL volume
- **Sandbox**: Isolated PostgreSQL instance for testing

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
- **Mobile Responsiveness**: Full functionality on mobile devices

## 🔍 Key Challenges & Solutions

### Technical Challenges
1. **Query Fingerprinting**: ✅ Reliable identification of similar queries across different parameters
2. **Execution Plan Analysis**: ✅ Accurate interpretation of PostgreSQL explain plans
3. **AI Prompt Engineering**: ✅ Effective prompts for consistent, actionable recommendations
4. **Real-time Performance**: ✅ Efficient WebSocket communication without overwhelming the client
5. **Large Dataset Handling**: ✅ Adaptive filtering and sampling for performance

### Business Considerations
1. **Cost Management**: ✅ OpenAI API usage optimization through caching
2. **Scalability**: ✅ Architecture that can handle multiple database instances
3. **Security**: ✅ Safe handling of database credentials and AI API keys
4. **User Experience**: ✅ Intuitive interface for database administrators

## 📚 Reference Materials

### PostgreSQL Resources
- `pg_stat_statements` extension documentation
- `EXPLAIN` command reference
- Performance tuning best practices

### AI/ML Resources
- Google Gemini API documentation
- DeepSeek API documentation
- Prompt engineering best practices
- Query optimization patterns

### Development Resources
- FastAPI documentation
- Next.js 14 features
- Docker Compose best practices
- WebSocket implementation patterns

---

## 🎯 Next Steps

1. **Immediate**: Continue performance optimization and UI enhancements
2. **Short-term**: Add more advanced visualizations and reporting features
3. **Medium-term**: Implement notification system and audit logging
4. **Long-term**: Scale to support multiple database instances and teams

This document serves as our single source of truth for project goals, architecture decisions, and development priorities. It will be updated as the project evolves. 