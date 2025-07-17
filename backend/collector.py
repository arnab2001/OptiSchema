"""
Collector module for OptiSchema backend.
Fetches and aggregates query metrics from pg_stat_statements.
"""

import asyncio
import logging
from typing import List, Dict, Any
from datetime import datetime

from db import get_pool
from connection_manager import connection_manager
from models import QueryMetrics
from config import settings
from utils import calculate_performance_score

# In-memory cache for collected metrics
metrics_cache: List[QueryMetrics] = []
last_updated: datetime = None

logger = logging.getLogger(__name__)

PG_STAT_QUERY = """
SELECT
    md5(query) AS query_hash,
    query,
    total_exec_time::BIGINT AS total_time,
    calls::BIGINT,
    mean_exec_time::FLOAT8 AS mean_time,
    stddev_exec_time::FLOAT8 AS stddev_time,
    min_exec_time::BIGINT AS min_time,
    max_exec_time::BIGINT AS max_time,
    rows::BIGINT,
    shared_blks_hit::BIGINT,
    shared_blks_read::BIGINT,
    shared_blks_written::BIGINT,
    shared_blks_dirtied::BIGINT,
    temp_blks_read::BIGINT,
    temp_blks_written::BIGINT,
    blk_read_time::FLOAT8,
    blk_write_time::FLOAT8
FROM pg_stat_statements
WHERE query NOT ILIKE 'EXPLAIN%' AND query NOT ILIKE 'DEALLOCATE%';
"""

async def fetch_pg_stat() -> List[QueryMetrics]:
    """Fetch query metrics from pg_stat_statements."""
    pool = await get_pool()
    if not pool:
        logger.warning("No database connection available")
        return []
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(PG_STAT_QUERY)
        
        # Calculate total time for percentage calculations
        total_time = sum(row['total_time'] for row in rows) if rows else 0
        
        metrics = []
        for row in rows:
            # Calculate percentage of total time
            percentage_of_total_time = (row['total_time'] / total_time * 100) if total_time > 0 else 0
            
            # Create a mock hot_query object for performance score calculation
            hot_query = type('HotQuery', (), {
                'mean_time': row['mean_time'],
                'calls': row['calls'],
                'percentage_of_total_time': percentage_of_total_time,
                'shared_blks_hit': row['shared_blks_hit'],
                'shared_blks_read': row['shared_blks_read'],
                'rows': row['rows']
            })()
            
            # Calculate performance score
            performance_score = round(calculate_performance_score(hot_query, None))
            
            metric = QueryMetrics(
                query_hash=row['query_hash'],
                query_text=row['query'],
                total_time=row['total_time'],
                calls=row['calls'],
                mean_time=row['mean_time'],
                stddev_time=row['stddev_time'],
                min_time=row['min_time'],
                max_time=row['max_time'],
                rows=row['rows'],
                shared_blks_hit=row['shared_blks_hit'],
                shared_blks_read=row['shared_blks_read'],
                shared_blks_written=row['shared_blks_written'],
                shared_blks_dirtied=row['shared_blks_dirtied'],
                temp_blks_read=row['temp_blks_read'],
                temp_blks_written=row['temp_blks_written'],
                blk_read_time=row['blk_read_time'],
                blk_write_time=row['blk_write_time'],
                performance_score=performance_score,
                time_percentage=percentage_of_total_time
            )
            metrics.append(metric)
        
        return metrics

async def poll_pg_stat():
    """Scheduled polling of pg_stat_statements every polling_interval seconds."""
    global metrics_cache, last_updated
    while True:
        try:
            logger.info("Polling pg_stat_statements for query metrics...")
            metrics = await fetch_pg_stat()
            metrics_cache = metrics
            last_updated = datetime.utcnow()
            logger.info(f"Fetched {len(metrics)} query metrics at {last_updated}")
        except Exception as e:
            logger.error(f"Error polling pg_stat_statements: {e}")
        await asyncio.sleep(settings.polling_interval)


def get_metrics_cache() -> List[QueryMetrics]:
    """Get the latest cached query metrics."""
    return metrics_cache

def get_last_updated() -> datetime:
    """Get the last updated timestamp for metrics cache."""
    return last_updated 