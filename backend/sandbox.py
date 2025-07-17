"""
Sandbox module for OptiSchema backend.
Handles sandbox environment management and benchmark testing.
"""

import asyncio
import logging
import asyncpg
from typing import Dict, Any, Optional
from datetime import datetime
from config import settings

logger = logging.getLogger(__name__)

# Sandbox database configuration
SANDBOX_CONFIG = {
    'host': 'postgres_sandbox',  # Docker service name
    'port': 5432,  # Internal port
    'database': 'sandbox',
    'user': 'sandbox',
    'password': 'sandbox_pass'
}


async def get_sandbox_connection() -> asyncpg.Connection:
    """Get connection to sandbox database."""
    try:
        conn = await asyncpg.connect(**SANDBOX_CONFIG)
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to sandbox: {e}")
        raise


async def run_benchmark_test(recommendation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run benchmark test for a recommendation in sandbox environment.
    
    Args:
        recommendation: The recommendation to test
        
    Returns:
        Benchmark results with before/after metrics
    """
    try:
        conn = await get_sandbox_connection()
        
        # Step 1: Measure baseline performance
        baseline_metrics = await measure_query_performance(conn, recommendation)
        
        # Check if baseline measurement failed
        if "error" in baseline_metrics:
            return {
                "success": False,
                "error": baseline_metrics["error"],
                "recommendation_id": recommendation.get("id"),
                "recommendation_type": recommendation.get("recommendation_type", "unknown")
            }
        
        # Step 2: Apply the optimization
        optimization_applied = await apply_optimization(conn, recommendation)
        
        if not optimization_applied:
            return {
                "success": False,
                "error": "Failed to apply optimization in sandbox",
                "baseline": baseline_metrics
            }
        
        # Step 3: Measure optimized performance
        optimized_metrics = await measure_query_performance(conn, recommendation)
        
        # Step 4: Calculate improvement
        improvement = calculate_improvement(baseline_metrics, optimized_metrics)
        
        # Step 5: Generate rollback SQL
        rollback_sql = generate_rollback_sql(recommendation)
        
        result = {
            "success": True,
            "recommendation_id": recommendation.get("id"),
            "baseline": baseline_metrics,
            "optimized": optimized_metrics,
            "improvement": improvement,
            "rollback_sql": rollback_sql,
            "tested_at": datetime.utcnow().isoformat()
        }
        
        await conn.close()
        return result
        
    except Exception as e:
        logger.error(f"Benchmark test failed: {e}")
        return {
            "success": False,
            "error": str(e),
            "recommendation_id": recommendation.get("id")
        }


async def measure_query_performance(conn: asyncpg.Connection, recommendation: Dict[str, Any]) -> Dict[str, Any]:
    """Measure query performance in sandbox."""
    try:
        query_text = recommendation.get("query_text", "")
        if not query_text:
            return {"error": "No query text provided for this recommendation. This is an advisory recommendation that cannot be automatically benchmarked."}
        
        # Run EXPLAIN ANALYZE to get performance metrics
        explain_result = await conn.fetchval(
            "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + query_text
        )
        
        # Extract key metrics
        metrics = extract_performance_metrics(explain_result)
        
        return {
            "execution_time": metrics.get("execution_time", 0),
            "planning_time": metrics.get("planning_time", 0),
            "total_time": metrics.get("total_time", 0),
            "rows": metrics.get("rows", 0),
            "shared_hit_blocks": metrics.get("shared_hit_blocks", 0),
            "shared_read_blocks": metrics.get("shared_read_blocks", 0),
            "shared_written_blocks": metrics.get("shared_written_blocks", 0),
            "temp_read_blocks": metrics.get("temp_read_blocks", 0),
            "temp_written_blocks": metrics.get("temp_written_blocks", 0),
            "explain_plan": explain_result
        }
        
    except Exception as e:
        logger.error(f"Performance measurement failed: {e}")
        return {"error": str(e)}


async def apply_optimization(conn: asyncpg.Connection, recommendation: Dict[str, Any]) -> bool:
    """Apply optimization in sandbox environment."""
    try:
        sql_fix = recommendation.get("sql_fix")
        if not sql_fix:
            return False
        
        # Execute the optimization SQL
        await conn.execute(sql_fix)
        return True
        
    except Exception as e:
        logger.error(f"Failed to apply optimization: {e}")
        return False


def calculate_improvement(baseline: Dict[str, Any], optimized: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate performance improvement between baseline and optimized metrics."""
    try:
        baseline_time = baseline.get("total_time", 0)
        optimized_time = optimized.get("total_time", 0)
        
        if baseline_time == 0:
            return {"error": "Invalid baseline metrics"}
        
        time_improvement = ((baseline_time - optimized_time) / baseline_time) * 100
        
        return {
            "time_improvement_percent": round(time_improvement, 2),
            "time_saved_ms": round(baseline_time - optimized_time, 2),
            "baseline_time_ms": round(baseline_time, 2),
            "optimized_time_ms": round(optimized_time, 2),
            "improvement_level": get_improvement_level(time_improvement)
        }
        
    except Exception as e:
        logger.error(f"Improvement calculation failed: {e}")
        return {"error": str(e)}


def get_improvement_level(improvement_percent: float) -> str:
    """Get improvement level based on percentage."""
    if improvement_percent >= 25:
        return "High"
    elif improvement_percent >= 10:
        return "Medium"
    elif improvement_percent >= 1:
        return "Low"
    else:
        return "Minimal"


def extract_performance_metrics(explain_result: Any) -> Dict[str, Any]:
    """Extract performance metrics from EXPLAIN ANALYZE result."""
    try:
        if not explain_result or not isinstance(explain_result, list):
            return {}
        
        plan = explain_result[0] if explain_result else {}
        
        return {
            "execution_time": float(plan.get("Execution Time", 0)),
            "planning_time": float(plan.get("Planning Time", 0)),
            "total_time": float(plan.get("Execution Time", 0)) + float(plan.get("Planning Time", 0)),
            "rows": int(plan.get("Actual Rows", 0)),
            "shared_hit_blocks": int(plan.get("Shared Hit Blocks", 0)),
            "shared_read_blocks": int(plan.get("Shared Read Blocks", 0)),
            "shared_written_blocks": int(plan.get("Shared Written Blocks", 0)),
            "temp_read_blocks": int(plan.get("Temp Read Blocks", 0)),
            "temp_written_blocks": int(plan.get("Temp Written Blocks", 0))
        }
        
    except Exception as e:
        logger.error(f"Failed to extract performance metrics: {e}")
        return {}


def generate_rollback_sql(recommendation: Dict[str, Any]) -> str:
    """Generate rollback SQL for the applied optimization."""
    recommendation_type = recommendation.get("recommendation_type", "")
    sql_fix = recommendation.get("sql_fix", "")
    
    if recommendation_type == "index":
        # Extract index name from CREATE INDEX statement
        if "CREATE INDEX" in sql_fix.upper():
            # Simple extraction - in production, use proper SQL parsing
            parts = sql_fix.split()
            if "ON" in parts:
                on_index = parts.index("ON")
                if on_index > 0:
                    index_name = parts[on_index - 1]
                    return f"DROP INDEX IF EXISTS {index_name};"
    
    elif recommendation_type == "config":
        # For configuration changes, we'd need to know the original value
        return "-- Configuration rollback requires manual intervention"
    
    return "-- Rollback SQL not available for this optimization type" 