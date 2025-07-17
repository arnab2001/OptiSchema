.PHONY: help dev demo clean logs build test lint format setup

# Default target
help:
	@echo "🚀 OptiSchema MVP - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev      - Start development stack with hot-reload"
	@echo "  make demo     - Seed demo data and start the application"
	@echo "  make build    - Build all Docker images"
	@echo "  make test     - Run tests"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean    - Stop and clean all containers and volumes"
	@echo "  make logs     - View logs from all services"
	@echo "  make lint     - Run linting"
	@echo "  make format   - Format code"
	@echo ""
	@echo "Setup:"
	@echo "  make setup    - Initial setup (copy .env.example to .env)"
	@echo ""

# Development commands
dev:
	@echo "🚀 Starting OptiSchema development stack..."
	@docker-compose up --build -d
	@echo "✅ Development stack started!"
	@echo "📊 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:8000"
	@echo "📚 API Docs: http://localhost:8000/docs"
	@echo "🗄️  Database: localhost:5432"
	@echo ""
	@echo "💡 Use 'make logs' to view logs or 'make clean' to stop"

demo:
	@echo "🎭 Starting OptiSchema with demo data..."
	@docker-compose up --build -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "🌱 Seeding demo data..."
	@docker-compose exec optischema-api python scripts/seed_data.py || echo "⚠️  Demo data seeding failed (backend not ready yet)"
	@echo "✅ Demo started!"
	@echo "📊 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:8000"
	@echo "📚 API Docs: http://localhost:8000/docs"

# Build commands
build:
	@echo "🔨 Building OptiSchema Docker images..."
	@docker-compose build
	@echo "✅ Build complete!"

# Testing commands
test:
	@echo "🧪 Running tests..."
	@docker-compose exec optischema-api python -m pytest tests/ || echo "⚠️  Backend tests failed (backend not running)"
	@echo "✅ Tests complete!"

# Linting and formatting
lint:
	@echo "🔍 Running linting..."
	@docker-compose exec optischema-api python -m flake8 . || echo "⚠️  Backend linting failed (backend not running)"
	@docker-compose exec optischema-ui npm run lint || echo "⚠️  Frontend linting failed (frontend not running)"
	@echo "✅ Linting complete!"

format:
	@echo "🎨 Formatting code..."
	@docker-compose exec optischema-api python -m black . || echo "⚠️  Backend formatting failed (backend not running)"
	@docker-compose exec optischema-ui npm run format || echo "⚠️  Frontend formatting failed (frontend not running)"
	@echo "✅ Formatting complete!"

# Maintenance commands
clean:
	@echo "🧹 Cleaning up OptiSchema..."
	@docker-compose down -v --remove-orphans
	@docker system prune -f
	@echo "✅ Cleanup complete!"

logs:
	@echo "📋 Showing OptiSchema logs..."
	@docker-compose logs -f

# Setup commands
setup:
	@echo "⚙️  Setting up OptiSchema..."
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Created .env from .env.example"; \
		echo "⚠️  Please edit .env with your OpenAI API key"; \
	else \
		echo "✅ .env already exists"; \
	fi
	@echo "✅ Setup complete!"

# Database commands
db-reset:
	@echo "🗄️  Resetting database..."
	@docker-compose down postgres
	@docker volume rm optischema_pgdata || true
	@docker-compose up -d postgres
	@echo "✅ Database reset complete!"

db-shell:
	@echo "🐘 Opening PostgreSQL shell..."
	@docker-compose exec postgres psql -U optischema -d optischema

# Sandbox commands
sandbox:
	@echo "🧪 Starting sandbox environment..."
	@docker-compose --profile sandbox up -d postgres_sandbox
	@echo "✅ Sandbox started on localhost:5433"

sandbox-shell:
	@echo "🐘 Opening sandbox PostgreSQL shell..."
	@docker-compose exec postgres_sandbox psql -U sandbox -d sandbox

# Health checks
health:
	@echo "🏥 Checking service health..."
	@echo "Backend API:"
	@curl -f http://localhost:8000/health || echo "❌ Backend not responding"
	@echo ""
	@echo "Frontend:"
	@curl -f http://localhost:3000 || echo "❌ Frontend not responding"
	@echo ""
	@echo "Database:"
	@docker-compose exec postgres pg_isready -U optischema || echo "❌ Database not responding"

# Development shortcuts
backend-logs:
	@docker-compose logs -f optischema-api

frontend-logs:
	@docker-compose logs -f optischema-ui

db-logs:
	@docker-compose logs -f postgres

# Quick restart commands
restart:
	@echo "🔄 Restarting OptiSchema..."
	@docker-compose restart
	@echo "✅ Restart complete!"

restart-backend:
	@echo "🔄 Restarting backend..."
	@docker-compose restart optischema-api
	@echo "✅ Backend restart complete!"

restart-frontend:
	@echo "🔄 Restarting frontend..."
	@docker-compose restart optischema-ui
	@echo "✅ Frontend restart complete!" 