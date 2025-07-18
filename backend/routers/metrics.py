"""
Metrics router for OptiSchema backend.
Provides endpoints for query metrics and performance data.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from analysis.core import calculate_performance_metrics, identify_hot_queries
from collector import get_metrics_cache
from connection_manager import connection_manager

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/raw")
async def get_raw_metrics(
    limit: int = Query(100, ge=1, le=5000, description="Number of queries to return"),
    offset: int = Query(0, ge=0, description="Number of queries to skip"),
    sort_by: str = Query("total_time", description="Field to sort by"),
    order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    min_calls: int = Query(1, ge=1, description="Minimum number of calls"),
    min_time: float = Query(0.0, ge=0.0, description="Minimum mean execution time (ms)"),
    search: Optional[str] = Query(None, description="Search query text"),
) -> Dict[str, Any]:
    """Return paginated query metrics with filtering and sorting."""
    # Check if we're connected to a database
    is_connected = await connection_manager.check_connection_health()
    if not is_connected:
        return {
            "queries": [],
            "pagination": {
                "total": 0,
                "limit": limit,
                "offset": offset,
                "has_more": False
            }
        }
    
    metrics = get_metrics_cache()
    if not metrics:
        return {
            "queries": [],
            "pagination": {
                "total": 0,
                "limit": limit,
                "offset": offset,
                "has_more": False
            }
        }
    
    # Convert Pydantic models to dictionaries
    metrics_data = [metric.model_dump() if hasattr(metric, 'model_dump') else metric for metric in metrics]
    
    # Apply filters
    filtered_metrics = []
    for metric in metrics_data:
        # Filter by minimum calls
        if metric.get('calls', 0) < min_calls:
            continue
            
        # Filter by minimum time
        if metric.get('mean_time', 0.0) < min_time:
            continue
            
        # Filter by search term
        if search and search.lower() not in metric.get('query_text', '').lower():
            continue
            
        filtered_metrics.append(metric)
    
    # Validate sort_by parameter
    valid_sort_fields = ["total_time", "mean_time", "calls", "rows", "time_percentage", "performance_score"]
    if sort_by not in valid_sort_fields:
        raise HTTPException(status_code=400, detail=f"Invalid sort_by. Must be one of: {valid_sort_fields}")
    
    # Sort metrics
    reverse = order == "desc"
    sorted_metrics = sorted(filtered_metrics, key=lambda x: x.get(sort_by, 0), reverse=reverse)
    
    # Apply pagination
    total = len(sorted_metrics)
    start = offset
    end = offset + limit
    paginated_metrics = sorted_metrics[start:end]
    
    return {
        "queries": paginated_metrics,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": end < total,
            "returned": len(paginated_metrics)
        },
        "filters": {
            "min_calls": min_calls,
            "min_time": min_time,
            "search": search
        }
    }


@router.get("/summary")
async def get_metrics_summary() -> Dict[str, Any]:
    """Return aggregated metrics summary."""
    metrics = get_metrics_cache()
    if not metrics:
        raise HTTPException(status_code=404, detail="No metrics available")
    
    summary = calculate_performance_metrics(metrics)
    
    # Add data size information
    summary["data_size"] = {
        "total_queries": len(metrics),
        "cache_size_mb": len(str(metrics)) / 1024 / 1024  # Rough estimate
    }
    
    return summary


@router.get("/hot")
async def get_hot_queries(limit: int = Query(10, ge=1, le=100)) -> List[Dict[str, Any]]:
    """Return the most expensive queries."""
    metrics = get_metrics_cache()
    if not metrics:
        return []
    
    hot_queries = identify_hot_queries(metrics, limit=limit)
    # Convert Pydantic models to dictionaries
    return [query.model_dump() if hasattr(query, 'model_dump') else query for query in hot_queries]


@router.get("/top")
async def get_top_queries(
    limit: int = Query(10, ge=1, le=100), 
    sort_by: str = Query("total_time")
) -> List[Dict[str, Any]]:
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


@router.get("/stats")
async def get_collection_stats() -> Dict[str, Any]:
    """Return collection statistics and performance info."""
    metrics = get_metrics_cache()
    
    if not metrics:
        return {
            "total_queries": 0,
            "collection_status": "no_data",
            "memory_usage": "0 MB",
            "last_update": None
        }
    
    # Calculate statistics
    total_queries = len(metrics)
    total_calls = sum(m.calls if hasattr(m, 'calls') else m.get('calls', 0) for m in metrics)
    total_time = sum(m.total_time if hasattr(m, 'total_time') else m.get('total_time', 0) for m in metrics)
    
    # Estimate memory usage
    memory_mb = len(str(metrics)) / 1024 / 1024
    
    return {
        "total_queries": total_queries,
        "total_calls": total_calls,
        "total_time_ms": total_time,
        "memory_usage_mb": round(memory_mb, 2),
        "collection_status": "active" if total_queries > 0 else "no_data",
        "performance": {
            "large_dataset": total_queries > 10000,
            "memory_warning": memory_mb > 100,
            "recommendation": get_performance_recommendation(total_queries, memory_mb)
        }
    }


def get_performance_recommendation(total_queries: int, memory_mb: float) -> str:
    """Get performance recommendations based on data size."""
    if total_queries > 100000:
        return "Very large dataset detected. Consider enabling sampling and increasing min_calls filter."
    elif total_queries > 50000:
        return "Large dataset detected. Consider using pagination and filtering for better performance."
    elif memory_mb > 100:
        return "High memory usage detected. Consider implementing data retention policies."
    elif total_queries > 10000:
        return "Medium dataset size. Pagination recommended for frontend display."
    else:
        return "Dataset size is manageable. No special optimizations needed." 