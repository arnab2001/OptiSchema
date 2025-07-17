"""
Analysis router for OptiSchema backend.
Provides endpoints for query analysis and analysis status.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional
from pydantic import BaseModel
from analysis.pipeline import get_analysis_cache, run_analysis_pipeline
from analysis.core import analyze_queries
from analysis.explain import execute_explain_plan
from db import get_pool

router = APIRouter(prefix="/analysis", tags=["analysis"])


class QueryAnalysisRequest(BaseModel):
    """Request model for query analysis."""
    query: str
    explain: bool = True
    optimize: bool = True


class QueryAnalysisResponse(BaseModel):
    """Response model for query analysis."""
    query: str
    execution_plan: Optional[Dict[str, Any]] = None
    analysis: Optional[Dict[str, Any]] = None
    optimization: Optional[str] = None
    recommendations: Optional[Dict[str, Any]] = None


@router.get("/latest")
async def get_latest_analysis() -> Dict[str, Any]:
    """Return the latest analysis results."""
    analysis_results = get_analysis_cache()
    if not analysis_results:
        raise HTTPException(status_code=404, detail="No analysis results available")
    return analysis_results


@router.post("/run")
async def run_analysis() -> Dict[str, Any]:
    """Manually trigger analysis pipeline."""
    try:
        results = await run_analysis_pipeline()
        return {
            "success": True,
            "message": "Analysis completed successfully",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/query", response_model=QueryAnalysisResponse)
async def analyze_query(request: QueryAnalysisRequest) -> QueryAnalysisResponse:
    """Analyze a specific query."""
    try:
        pool = get_pool()
        if not pool:
            raise HTTPException(status_code=500, detail="Database connection not available")
        
        response = QueryAnalysisResponse(query=request.query)
        
        # Get execution plan if requested
        if request.explain:
            try:
                plan = await execute_explain_plan(request.query)
                response.execution_plan = plan
            except Exception as e:
                # Plan analysis failed, but continue with other analysis
                response.execution_plan = {"error": str(e)}
        
        # Analyze the query
        # For single query analysis, we'll create a simple analysis result
        analysis_result = {
            "query_text": request.query,
            "query_hash": hash(request.query),
            "analysis_summary": "Query analysis completed",
            "performance_score": 75,  # Default score
            "bottleneck_type": "unknown"
        }
        response.analysis = analysis_result
        
        # Generate optimization if requested
        if request.optimize:
            try:
                from analysis.llm import rewrite_query
                optimized = await rewrite_query(request.query)
                response.optimization = optimized
            except Exception as e:
                response.optimization = f"Optimization failed: {str(e)}"
        
        # Generate recommendations
        try:
            from analysis.llm import generate_recommendation
            query_data = {
                "query_text": request.query,
                "analysis": analysis_result,
                "execution_plan": response.execution_plan
            }
            recommendation = await generate_recommendation(query_data)
            response.recommendations = recommendation
        except Exception as e:
            response.recommendations = {"error": str(e)}
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query analysis failed: {str(e)}")


@router.get("/status")
async def get_analysis_status() -> Dict[str, Any]:
    """Get the current analysis status."""
    analysis_results = get_analysis_cache()
    
    return {
        "last_analysis": analysis_results.get("timestamp") if analysis_results else None,
        "total_queries_analyzed": analysis_results.get("total_queries_analyzed", 0) if analysis_results else 0,
        "hot_queries_found": len(analysis_results.get("hot_queries", [])) if analysis_results else 0,
        "recommendations_generated": len(analysis_results.get("recommendations", [])) if analysis_results else 0,
        "analysis_running": False,  # TODO: Implement analysis status tracking
        "next_scheduled": None  # TODO: Implement scheduling status
    }


@router.get("/history")
async def get_analysis_history(limit: int = 10) -> Dict[str, Any]:
    """Get analysis history (placeholder for future implementation)."""
    # TODO: Implement analysis history storage and retrieval
    return {
        "message": "Analysis history not yet implemented",
        "limit": limit,
        "history": []
    } 