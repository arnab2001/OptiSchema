"""
Recommendation generation for OptiSchema backend.
Combines heuristics and AI to generate actionable optimization suggestions.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from models import QueryMetrics, Recommendation, AnalysisResult
from analysis.core import detect_basic_issues
from analysis.llm import generate_recommendation, rewrite_query

logger = logging.getLogger(__name__)


def score_recommendation(analysis: AnalysisResult) -> int:
    """
    Score a recommendation based on performance impact and confidence.
    """
    score = 50
    # Heuristic: penalize for low performance score
    if analysis.performance_score is not None:
        score += int(analysis.performance_score / 2)
    # Heuristic: boost for detected bottlenecks
    if analysis.bottleneck_type in ("sequential_scan", "missing_index", "large_sort"):
        score += 20
    # Cap between 0 and 100
    return max(0, min(100, score))


def estimate_improvement(analysis: AnalysisResult) -> int:
    """
    Estimate the percent improvement if the recommendation is applied.
    """
    # Simple heuristic: higher for high-impact bottlenecks
    if analysis.bottleneck_type == "sequential_scan":
        return 50
    if analysis.bottleneck_type == "missing_index":
        return 40
    if analysis.bottleneck_type == "large_sort":
        return 20
    if analysis.performance_score is not None and analysis.performance_score < 50:
        return 10
    return 5


async def generate_recommendations_for_analysis(analysis: AnalysisResult) -> List[Recommendation]:
    """
    Generate recommendations for a single analysis result.
    Combines heuristics and AI suggestions.
    """
    recs: List[Recommendation] = []
    # Heuristic recommendations
    if analysis.bottleneck_type in ("sequential_scan", "missing_index"):
        recs.append(Recommendation(
            query_hash=analysis.query_hash,
            recommendation_type="index",
            title="Add Index",
            description="Consider adding an index to improve query performance.",
            sql_fix=None,
            estimated_improvement_percent=estimate_improvement(analysis),
            confidence_score=score_recommendation(analysis),
            risk_level="low",
            applied=False,
            created_at=datetime.utcnow()
        ))
    if analysis.bottleneck_type == "large_sort":
        recs.append(Recommendation(
            query_hash=analysis.query_hash,
            recommendation_type="index",
            title="Add Index for Sort",
            description="Consider adding an index to optimize ORDER BY performance.",
            sql_fix=None,
            estimated_improvement_percent=estimate_improvement(analysis),
            confidence_score=score_recommendation(analysis),
            risk_level="low",
            applied=False,
            created_at=datetime.utcnow()
        ))
    # AI-powered recommendation
    ai_rec = await generate_recommendation({
        "query_text": analysis.query_text,
        "bottleneck_type": analysis.bottleneck_type,
        "performance_score": analysis.performance_score,
        "summary": analysis.analysis_summary
    })
    recs.append(Recommendation(
        query_hash=analysis.query_hash,
        recommendation_type="ai",
        title=ai_rec.get("title", "AI Recommendation"),
        description=ai_rec.get("description", ""),
        sql_fix=ai_rec.get("sql_fix"),
        estimated_improvement_percent=estimate_improvement(analysis),
        confidence_score=score_recommendation(analysis),
        risk_level="medium",
        applied=False,
        created_at=datetime.utcnow()
    ))
    # Query rewrite suggestion (AI)
    if analysis.bottleneck_type in ("sequential_scan", "large_sort", "inefficient_select"):
        try:
            optimized_sql = await rewrite_query(analysis.query_text)
            if optimized_sql and optimized_sql != analysis.query_text:
                recs.append(Recommendation(
                    query_hash=analysis.query_hash,
                    recommendation_type="rewrite",
                    title="Rewrite Query",
                    description="AI-optimized query for better performance.",
                    sql_fix=optimized_sql,
                    estimated_improvement_percent=estimate_improvement(analysis),
                    confidence_score=score_recommendation(analysis),
                    risk_level="medium",
                    applied=False,
                    created_at=datetime.utcnow()
                ))
        except Exception as e:
            logger.warning(f"Query rewrite failed: {e}")
    return recs


async def generate_recommendations(analyses: List[AnalysisResult]) -> List[Recommendation]:
    """
    Generate recommendations for a list of analysis results.
    """
    all_recs: List[Recommendation] = []
    for analysis in analyses:
        recs = await generate_recommendations_for_analysis(analysis)
        all_recs.extend(recs)
    return all_recs


async def apply_recommendation(recommendation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply a recommendation (placeholder implementation).
    In a real implementation, this would execute the SQL fix or apply the optimization.
    """
    try:
        # For now, just mark as applied and return success
        # TODO: Implement actual recommendation application logic
        recommendation_type = recommendation.get("type", "unknown")
        sql_fix = recommendation.get("sql_fix")
        
        if sql_fix:
            # TODO: Execute the SQL fix in a sandbox environment
            logger.info(f"Would apply SQL fix: {sql_fix}")
        
        return {
            "success": True,
            "message": f"Recommendation '{recommendation.get('title', 'Unknown')}' applied successfully",
            "recommendation_type": recommendation_type,
            "sql_executed": sql_fix,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to apply recommendation: {e}")
        return {
            "success": False,
            "message": f"Failed to apply recommendation: {str(e)}",
            "error": str(e)
        } 