"""
Main FastAPI application for OptiSchema backend.
Provides health endpoints, CORS configuration, and WebSocket support.
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import APIRouter

from config import settings
from db import initialize_database, close_pool, health_check as db_health_check
from models import HealthCheck, WebSocketMessage, APIResponse
from collector import poll_pg_stat, get_metrics_cache
from analysis.pipeline import start_analysis_scheduler

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables
start_time = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("🚀 Starting OptiSchema backend...")
    
    # Initialize database connection pool
    try:
        success = await initialize_database()
        if success:
            logger.info("✅ Database connection pool initialized")
        else:
            logger.error("❌ Failed to initialize database connection pool")
            raise Exception("Database initialization failed")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database connection pool: {e}")
        raise
    
    # Test database connection
    await db_health_check()
    
    # Start the background polling task for query metrics
    loop = asyncio.get_event_loop()
    collector_task = loop.create_task(poll_pg_stat())
    logger.info("✅ Started pg_stat_statements polling task")
    
    # Start the analysis scheduler
    analysis_task = loop.create_task(start_analysis_scheduler())
    logger.info("✅ Started analysis scheduler")
    
    logger.info("✅ OptiSchema backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down OptiSchema backend...")
    
    # Cancel the collector task
    collector_task.cancel()
    try:
        await collector_task
    except asyncio.CancelledError:
        pass
    logger.info("✅ Collector task cancelled")
    
    # Cancel the analysis task
    analysis_task.cancel()
    try:
        await analysis_task
    except asyncio.CancelledError:
        pass
    logger.info("✅ Analysis task cancelled")
    
    # Close database connection pool
    await close_pool()
    logger.info("✅ Database connection pool closed")
    
    logger.info("✅ OptiSchema backend shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="OptiSchema API",
    description="AI-assisted PostgreSQL performance optimization service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




# Import routers
from routers import metrics_router, suggestions_router, analysis_router
from routers import connection

# Include routers
app.include_router(metrics_router)
app.include_router(suggestions_router)
app.include_router(analysis_router)
app.include_router(connection.router, prefix="/api/connection", tags=["connection"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "OptiSchema API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint."""
    try:
        # Check database health
        db_healthy = await db_health_check()
        
        # Check OpenAI API (basic check - we'll implement this later)
        openai_healthy = bool(settings.openai_api_key)
        
        # Determine overall status
        status = "healthy" if db_healthy and openai_healthy else "unhealthy"
        
        return HealthCheck(
            status=status,
            timestamp=datetime.utcnow(),
            database=db_healthy,
            openai=openai_healthy,
            version="1.0.0",
            uptime=time.time() - start_time
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheck(
            status="unhealthy",
            timestamp=datetime.utcnow(),
            database=False,
            openai=False,
            version="1.0.0",
            uptime=time.time() - start_time
        )


@app.get("/api/health")
async def api_health():
    """API health check endpoint."""
    return await health_check()


# Import WebSocket module
from websocket import handle_websocket_connection

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await handle_websocket_connection(websocket)


# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": str(exc) if settings.debug else "An unexpected error occurred"
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """HTTP exception handler."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error": str(exc)
        }
    )


# Import and include routers (we'll create these in the next steps)
# from routers import metrics, suggestions, analysis, connection
# app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
# app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
# app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.backend_host,
        port=settings.backend_port,
        reload=settings.backend_reload,
        log_level=settings.log_level.lower()
    ) 