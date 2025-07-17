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

# Configure logging
logger = logging.getLogger(__name__)

# Global connection pool
_pool: Optional[Pool] = None


async def create_pool() -> Pool:
    """Create and return a PostgreSQL connection pool."""
    global _pool
    
    if _pool is not None:
        return _pool
    
    try:
        db_config = get_database_config()
        
        logger.info(f"Creating database connection pool to {db_config['host']}:{db_config['port']}")
        
        _pool = await asyncpg.create_pool(
            host=db_config['host'],
            port=db_config['port'],
            database=db_config['database'],
            user=db_config['user'],
            password=db_config['password'],
            min_size=5,
            max_size=20,
            command_timeout=60,
            server_settings={
                'application_name': 'optischema_backend',
                'search_path': 'optischema,public'
            }
        )
        
        logger.info("Database connection pool created successfully")
        return _pool
        
    except Exception as e:
        logger.error(f"Failed to create database connection pool: {e}")
        raise


async def get_pool() -> Pool:
    """Get the global connection pool, creating it if necessary."""
    global _pool
    
    if _pool is None:
        _pool = await create_pool()
    
    return _pool


async def get_connection() -> Connection:
    """Get a connection from the pool."""
    pool = await get_pool()
    return await pool.acquire()


async def release_connection(connection: Connection):
    """Release a connection back to the pool."""
    pool = await get_pool()
    await pool.release(connection)


async def health_check() -> bool:
    """Check if the database connection is healthy."""
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


async def close_pool():
    """Close the database connection pool."""
    global _pool
    
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed")


async def execute_query(query: str, *args) -> str:
    """Execute a query and return the result as a string."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(query, *args)
        return result


async def fetch_query(query: str, *args) -> list:
    """Execute a query and return the results as a list of dictionaries."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def fetch_one(query: str, *args) -> Optional[Dict[str, Any]]:
    """Execute a query and return a single row as a dictionary."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def test_connection():
    """Test the database connection and log the result."""
    try:
        is_healthy = await health_check()
        if is_healthy:
            logger.info("✅ Database connection test successful")
            
            # Test basic query execution
            result = await fetch_one("SELECT version()")
            if result:
                logger.info(f"PostgreSQL version: {result['version']}")
            
            # Test schema access
            schema_result = await fetch_one(
                "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'optischema'"
            )
            if schema_result:
                logger.info("✅ OptiSchema schema found")
            else:
                logger.warning("⚠️  OptiSchema schema not found - initialization may be needed")
                
        else:
            logger.error("❌ Database connection test failed")
            
    except Exception as e:
        logger.error(f"❌ Database connection test failed with exception: {e}")


# Context manager for database transactions
class DatabaseTransaction:
    """Context manager for database transactions."""
    
    def __init__(self):
        self.connection: Optional[Connection] = None
        self.transaction = None
    
    async def __aenter__(self):
        self.connection = await get_connection()
        self.transaction = self.connection.transaction()
        await self.transaction.start()
        return self.connection
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.transaction:
            if exc_type is None:
                await self.transaction.commit()
            else:
                await self.transaction.rollback()
        
        if self.connection:
            await release_connection(self.connection) 