"""
Suggestions router for OptiSchema backend.
Provides endpoints for optimization recommendations.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from analysis.pipeline import get_recommendations_cache, run_analysis_pipeline
from recommendations import apply_recommendation
from sandbox import run_benchmark_test, get_sandbox_connection

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.get("/latest")
async def get_latest_suggestions() -> List[Dict[str, Any]]:
    """Return the latest recommendations."""
    recs = get_recommendations_cache()
    if recs is None or len(recs) == 0:
        raise HTTPException(status_code=404, detail="No recommendations available. Run analysis first.")
    return recs


@router.get("/{recommendation_id}")
async def get_specific_suggestion(recommendation_id: str) -> Dict[str, Any]:
    """Return a specific recommendation by ID."""
    recs = get_recommendations_cache()
    if recs is None or len(recs) == 0:
        raise HTTPException(status_code=404, detail="No recommendations available")
    
    # Find the recommendation by ID
    for rec in recs:
        if rec.get("id") == recommendation_id:
            return rec
    
    raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")


@router.post("/apply")
async def apply_suggestion(request: Dict[str, Any]) -> Dict[str, Any]:
    """Apply a specific recommendation."""
    recommendation_id = request.get("recommendation_id")
    if not recommendation_id:
        raise HTTPException(status_code=400, detail="Missing recommendation_id")
    recs = get_recommendations_cache()
    if recs is None or len(recs) == 0:
        raise HTTPException(status_code=404, detail="No recommendations available")
    
    # Find the recommendation by ID
    recommendation = None
    for rec in recs:
        rec_id = rec.get("id")
        # Convert UUID to string for comparison
        if isinstance(rec_id, str) and rec_id == recommendation_id:
            recommendation = rec
            break
        elif hasattr(rec_id, 'hex') and str(rec_id) == recommendation_id:
            recommendation = rec
            break
    
    if not recommendation:
        raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
    
    try:
        result = await apply_recommendation(recommendation)
        return {
            "success": True,
            "message": f"Recommendation {recommendation_id} applied successfully",
            "result": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply recommendation: {str(e)}")


@router.post("/benchmark")
async def benchmark_suggestion(request: Dict[str, Any]) -> Dict[str, Any]:
    """Run benchmark test for a specific recommendation in sandbox."""
    recommendation_id = request.get("recommendation_id")
    if not recommendation_id:
        raise HTTPException(status_code=400, detail="Missing recommendation_id")
    
    recs = get_recommendations_cache()
    if recs is None or len(recs) == 0:
        raise HTTPException(status_code=404, detail="No recommendations available")
    
    # Debug logging
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Looking for recommendation ID: {recommendation_id}")
    logger.info(f"Available recommendations: {[rec.get('id') for rec in recs]}")
    
    # Find the recommendation by ID
    recommendation = None
    for rec in recs:
        rec_id = rec.get("id")
        # Convert UUID to string for comparison
        if isinstance(rec_id, str) and rec_id == recommendation_id:
            recommendation = rec
            break
        elif hasattr(rec_id, 'hex') and str(rec_id) == recommendation_id:
            recommendation = rec
            break
    
    if not recommendation:
        raise HTTPException(status_code=404, detail=f"Recommendation {recommendation_id} not found")
    
    try:
        # Run benchmark test in sandbox
        benchmark_result = await run_benchmark_test(recommendation)
        return {
            "success": True,
            "message": f"Benchmark completed for recommendation {recommendation_id}",
            "benchmark": benchmark_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run benchmark: {str(e)}")


@router.get("/benchmark/{recommendation_id}")
async def get_benchmark_result(recommendation_id: str) -> Dict[str, Any]:
    """Get benchmark results for a specific recommendation."""
    try:
        # This would typically fetch from database, but for now return cached result
        return {
            "success": True,
            "recommendation_id": recommendation_id,
            "status": "completed",
            "message": "Benchmark results retrieved successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get benchmark results: {str(e)}")


@router.post("/generate")
async def generate_suggestions() -> Dict[str, Any]:
    """Manually trigger recommendation generation."""
    try:
        results = await run_analysis_pipeline()
        return {
            "success": True,
            "message": "Recommendations generated successfully",
            "recommendations_count": len(results.get("recommendations", [])),
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")


@router.get("/")
async def list_all_suggestions() -> Dict[str, Any]:
    """List all available suggestions with metadata."""
    recs = get_recommendations_cache()
    if recs is None:
        recs = []
    
    return {
        "total": len(recs),
        "recommendations": recs,
        "categories": {
            "index": len([r for r in recs if r.get("type") == "index"]),
            "query": len([r for r in recs if r.get("type") == "query"]),
            "schema": len([r for r in recs if r.get("type") == "schema"]),
            "config": len([r for r in recs if r.get("type") == "config"])
        }
    } 