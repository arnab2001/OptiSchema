"""
Database connection manager for OptiSchema backend.
Handles dynamic database connection switching and management.
"""

import asyncio
import logging
from typing import Optional, Dict, Any
import asyncpg
from asyncpg import Pool, Connection
from datetime import datetime

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages database connections and allows dynamic switching."""
    
    def __init__(self):
        self._current_pool: Optional[Pool] = None
        self._current_config: Optional[Dict[str, Any]] = None
        self._connection_history: list = []
        self._lock = asyncio.Lock()
    
    async def connect(self, config: Dict[str, Any]) -> bool:
        """
        Connect to a new database.
        
        Args:
            config: Database configuration dictionary
            
        Returns:
            True if connection successful, False otherwise
        """
        async with self._lock:
            try:
                # Close existing connection if any
                if self._current_pool:
                    await self._current_pool.close()
                
                # Prepare SSL configuration
                ssl_config = None
                if config.get('ssl', False):
                    ssl_config = 'require'
                
                # Create new connection pool
                pool = await asyncpg.create_pool(
                    host=config['host'],
                    port=config['port'],
                    database=config['database'],
                    user=config['user'],
                    password=config['password'],
                    ssl=ssl_config,
                    min_size=5,
                    max_size=20,
                    command_timeout=60,
                    server_settings={
                        'application_name': 'optischema_backend',
                        'search_path': 'optischema,public'
                    }
                )
                
                # Test the connection
                async with pool.acquire() as conn:
                    # Check if pg_stat_statements extension is available
                    extension_exists = await conn.fetchval(
                        "SELECT EXISTS(SELECT 1 FROM pg_available_extensions WHERE name = 'pg_stat_statements')"
                    )
                    
                    if not extension_exists:
                        await pool.close()
                        logger.error("pg_stat_statements extension not available")
                        return False
                    
                    # Check if extension is enabled
                    extension_enabled = await conn.fetchval(
                        "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')"
                    )
                    
                    if not extension_enabled:
                        # Try to enable the extension
                        try:
                            await conn.execute("CREATE EXTENSION IF NOT EXISTS pg_stat_statements")
                            logger.info("pg_stat_statements extension enabled")
                        except Exception as e:
                            logger.warning(f"Could not enable pg_stat_statements: {e}")
                
                # Update current connection
                self._current_pool = pool
                self._current_config = config.copy()
                
                # Add to history
                self._connection_history.append({
                    'config': config.copy(),
                    'connected_at': datetime.utcnow(),
                    'status': 'connected'
                })
                
                # Keep only last 10 connections in history
                if len(self._connection_history) > 10:
                    self._connection_history = self._connection_history[-10:]
                
                logger.info(f"Successfully connected to {config['host']}:{config['port']}/{config['database']}")
                return True
                
            except Exception as e:
                logger.error(f"Failed to connect to database: {e}")
                return False
    
    async def get_pool(self) -> Optional[Pool]:
        """Get the current connection pool."""
        return self._current_pool
    
    async def get_connection(self) -> Optional[Connection]:
        """Get a connection from the current pool."""
        pool = await self.get_pool()
        if pool:
            return await pool.acquire()
        return None
    
    def get_current_config(self) -> Optional[Dict[str, Any]]:
        """Get the current database configuration."""
        return self._current_config
    
    def get_connection_history(self) -> list:
        """Get the connection history."""
        return self._connection_history.copy()
    
    async def disconnect(self):
        """Disconnect from the current database."""
        async with self._lock:
            if self._current_pool:
                await self._current_pool.close()
                self._current_pool = None
                self._current_config = None
                logger.info("Disconnected from database")
    
    async def test_connection(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test a database connection without switching to it.
        
        Args:
            config: Database configuration to test
            
        Returns:
            Test result dictionary
        """
        try:
            # Prepare SSL configuration
            ssl_config = None
            if config.get('ssl', False):
                ssl_config = 'require'
            
            # Create a temporary connection
            conn = await asyncpg.connect(
                host=config['host'],
                port=config['port'],
                database=config['database'],
                user=config['user'],
                password=config['password'],
                ssl=ssl_config
            )
            
            # Check if pg_stat_statements extension is available
            extension_exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM pg_available_extensions WHERE name = 'pg_stat_statements')"
            )
            
            # Check if extension is enabled
            extension_enabled = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')"
            )
            
            # Get database info
            db_info = await conn.fetchrow(
                "SELECT version(), current_database(), current_user"
            )
            
            await conn.close()
            
            return {
                'success': True,
                'message': 'Connection successful',
                'details': {
                    'version': db_info[0],
                    'database': db_info[1],
                    'user': db_info[2],
                    'pg_stat_statements_available': extension_exists,
                    'pg_stat_statements_enabled': extension_enabled
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Connection failed: {str(e)}',
                'details': None
            }
    
    def is_connected(self) -> bool:
        """Check if currently connected to a database."""
        return self._current_pool is not None

# Global connection manager instance
connection_manager = ConnectionManager() 