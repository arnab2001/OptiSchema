"""
Suggestions router for OptiSchema backend.
Provides endpoints for optimization recommendations.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from analysis.pipeline import get_recommendations_cache, run_analysis_pipeline
from recommendations import apply_recommendation

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
async def apply_suggestion(recommendation_id: str) -> Dict[str, Any]:
    """Apply a specific recommendation."""
    recs = get_recommendations_cache()
    if recs is None or len(recs) == 0:
        raise HTTPException(status_code=404, detail="No recommendations available")
    
    # Find the recommendation by ID
    recommendation = None
    for rec in recs:
        if rec.get("id") == recommendation_id:
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