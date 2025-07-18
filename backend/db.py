"""
Database connection module for OptiSchema backend.
Handles async PostgreSQL connection pooling and health checks.
"""

import asyncio
import logging
from typing import Optional, Dict, Any
import asyncpg
from asyncpg import Pool, Connection

from config import settings, get_database_config
from connection_manager import connection_manager

# Configure logging
logger = logging.getLogger(__name__)


async def initialize_database():
    """Initialize the database connection using the connection manager."""
    try:
        db_config = get_database_config()
        success = await connection_manager.connect(db_config)
        
        if success:
            logger.info("Database connection initialized successfully")
        else:
            logger.error("Failed to initialize database connection")
            
        return success
        
    except Exception as e:
        logger.error(f"Failed to initialize database connection: {e}")
        return False


async def get_pool() -> Optional[Pool]:
    """Get the current connection pool from the connection manager."""
    return await connection_manager.get_pool()


async def get_connection() -> Optional[Connection]:
    """Get a connection from the current pool."""
    return await connection_manager.get_connection()


async def close_pool():
    """Close the current connection pool."""
    await connection_manager.disconnect()


async def health_check() -> bool:
    """Check if the database connection is healthy."""
    try:
        pool = await get_pool()
        if pool is None:
            return False
            
        async with pool.acquire() as conn:
            # Execute a simple query to test the connection
            await conn.fetchval("SELECT 1")
        return True
        
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


def get_current_config() -> Optional[Dict[str, Any]]:
    """Get the current database configuration."""
    return connection_manager.get_current_config()


def is_connected() -> bool:
    """Check if currently connected to a database."""
    return connection_manager.is_connected()

async def check_connection_health() -> bool:
    """Check if the current connection is actually healthy."""
    return await connection_manager.check_connection_health() 