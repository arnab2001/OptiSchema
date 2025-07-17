# OptiSchema Makefile
# Commands for development, demo, and sandbox operations

.PHONY: help dev demo sandbox seed replay clean logs

help: ## Show this help message
	@echo "OptiSchema - AI-Powered PostgreSQL Optimization"
	@echo ""
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment (main app)
	@echo "🚀 Starting OptiSchema development environment..."
	docker compose up -d
	@echo "✅ Development environment started!"
	@echo "📊 Dashboard: http://localhost:3000/dashboard"
	@echo "🔧 API: http://localhost:8000/health"

demo: ## Start demo environment with seeded data
	@echo "🎭 Starting OptiSchema demo environment..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 15
	@echo "🌱 Seeding demo data..."
	docker compose exec optischema-api python /scripts/seed_data.py
	@echo "✅ Demo environment ready!"
	@echo "📊 Dashboard: http://localhost:3000/dashboard"
	@echo "🔧 API: http://localhost:8000/health"

sandbox: ## Start sandbox environment for testing patches
	@echo "🧪 Starting OptiSchema sandbox environment..."
	docker compose -f docker-compose.sandbox.yml up -d
	@echo "✅ Sandbox environment started!"
	@echo "🔧 Sandbox API: http://localhost:8001/health"
	@echo "🗄️  Sandbox DB: localhost:5433"

seed: ## Seed demo data into existing database
	@echo "🌱 Seeding demo data..."
	docker compose exec optischema-api python /scripts/seed_data.py

replay: ## Start query replay for continuous demo data
	@echo "🎭 Starting query replay..."
	docker compose exec optischema-api python /scripts/replay.py

replay-background: ## Start query replay in background
	@echo "🎭 Starting query replay in background..."
	docker compose exec -d optischema-api python /scripts/replay.py

stop-replay: ## Stop query replay
	@echo "🛑 Stopping query replay..."
	docker compose exec optischema-api pkill -f replay.py || true

clean: ## Stop and clean all containers and volumes
	@echo "🧹 Cleaning up..."
	docker compose down -v
	docker compose -f docker-compose.sandbox.yml down -v
	docker system prune -f
	@echo "✅ Cleanup completed!"

logs: ## Show logs from all services
	docker compose logs -f

logs-api: ## Show API logs
	docker compose logs -f optischema-api

logs-ui: ## Show UI logs
	docker compose logs -f optischema-ui

logs-db: ## Show database logs
	docker compose logs -f postgres

status: ## Show status of all services
	@echo "📊 OptiSchema Service Status:"
	docker compose ps
	@echo ""
	@echo "🔗 URLs:"
	@echo "  Dashboard: http://localhost:3000/dashboard"
	@echo "  API Health: http://localhost:8000/health"
	@echo "  API Metrics: http://localhost:8000/metrics/raw"
	@echo "  API Suggestions: http://localhost:8000/suggestions/latest"

test-api: ## Test API endpoints
	@echo "🧪 Testing API endpoints..."
	@echo "Health check:"
	@curl -s http://localhost:8000/health | jq . || echo "❌ Health check failed"
	@echo "Metrics:"
	@curl -s http://localhost:8000/metrics/raw | jq '.[0:2]' || echo "❌ Metrics failed"
	@echo "Suggestions:"
	@curl -s http://localhost:8000/suggestions/latest | jq '.[0:1]' || echo "❌ Suggestions failed"

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker compose restart
	@echo "✅ Services restarted!"

restart-api: ## Restart API service
	@echo "🔄 Restarting API service..."
	docker compose restart optischema-api
	@echo "✅ API service restarted!"

restart-ui: ## Restart UI service
	@echo "🔄 Restarting UI service..."
	docker compose restart optischema-ui
	@echo "✅ UI service restarted!" 