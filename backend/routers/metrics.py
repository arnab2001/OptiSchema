"""
Metrics router for OptiSchema backend.
Provides endpoints for query metrics and performance data.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from analysis.core import calculate_performance_metrics, identify_hot_queries
from collector import get_metrics_cache

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/raw")
async def get_raw_metrics() -> List[Dict[str, Any]]:
    """Return the latest cached query metrics."""
    metrics = get_metrics_cache()
    if not metrics:
        return []
    # Convert Pydantic models to dictionaries
    return [metric.model_dump() if hasattr(metric, 'model_dump') else metric for metric in metrics]


@router.get("/summary")
async def get_metrics_summary() -> Dict[str, Any]:
    """Return aggregated metrics summary."""
    metrics = get_metrics_cache()
    if not metrics:
        raise HTTPException(status_code=404, detail="No metrics available")
    
    summary = calculate_performance_metrics(metrics)
    return summary


@router.get("/hot")
async def get_hot_queries(limit: int = 10) -> List[Dict[str, Any]]:
    """Return the most expensive queries."""
    metrics = get_metrics_cache()
    if not metrics:
        return []
    
    hot_queries = identify_hot_queries(metrics, limit=limit)
    # Convert Pydantic models to dictionaries
    return [query.model_dump() if hasattr(query, 'model_dump') else query for query in hot_queries]


@router.get("/top")
async def get_top_queries(limit: int = 10, sort_by: str = "total_time") -> List[Dict[str, Any]]:
    """Return top queries sorted by specified criteria."""
    metrics = get_metrics_cache()
    if not metrics:
        return []
    
    # Validate sort_by parameter
    valid_sort_fields = ["total_time", "mean_time", "calls", "rows"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(status_code=400, detail=f"Invalid sort_by. Must be one of: {valid_sort_fields}")
    
    # Sort metrics by the specified field
    sorted_metrics = sorted(metrics, key=lambda x: x.get(sort_by, 0), reverse=True)
    # Convert Pydantic models to dictionaries
    return [metric.model_dump() if hasattr(metric, 'model_dump') else metric for metric in sorted_metrics[:limit]] 