"""
Pydantic models for OptiSchema backend.
Defines data structures for query metrics, analysis results, and recommendations.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID


class QueryMetrics(BaseModel):
    """Model for PostgreSQL query metrics from pg_stat_statements."""
    
    query_hash: str = Field(..., description="Hash of the query text")
    query_text: str = Field(..., description="The actual SQL query text")
    total_time: int = Field(..., description="Total time spent executing this query (microseconds)")
    calls: int = Field(..., description="Number of times this query was executed")
    mean_time: float = Field(..., description="Mean execution time (microseconds)")
    stddev_time: Optional[float] = Field(None, description="Standard deviation of execution time")
    min_time: Optional[int] = Field(None, description="Minimum execution time")
    max_time: Optional[int] = Field(None, description="Maximum execution time")
    rows: Optional[int] = Field(None, description="Total number of rows retrieved or affected")
    shared_blks_hit: Optional[int] = Field(None, description="Shared blocks hit")
    shared_blks_read: Optional[int] = Field(None, description="Shared blocks read")
    shared_blks_written: Optional[int] = Field(None, description="Shared blocks written")
    shared_blks_dirtied: Optional[int] = Field(None, description="Shared blocks dirtied")
    temp_blks_read: Optional[int] = Field(None, description="Temporary blocks read")
    temp_blks_written: Optional[int] = Field(None, description="Temporary blocks written")
    blk_read_time: Optional[float] = Field(None, description="Time spent reading blocks")
    blk_write_time: Optional[float] = Field(None, description="Time spent writing blocks")
    performance_score: Optional[int] = Field(None, ge=0, le=100, description="Performance score (0-100)")
    time_percentage: Optional[float] = Field(None, description="Percentage of total database time")
    
    model_config = ConfigDict(from_attributes=True)


class ExecutionPlan(BaseModel):
    """Model for PostgreSQL execution plan analysis."""
    
    plan_json: Dict[str, Any] = Field(..., description="Raw execution plan JSON")
    total_cost: Optional[float] = Field(None, description="Total cost of the plan")
    total_time: Optional[float] = Field(None, description="Estimated total time")
    planning_time: Optional[float] = Field(None, description="Planning time")
    execution_time: Optional[float] = Field(None, description="Execution time")
    nodes: List[Dict[str, Any]] = Field(default_factory=list, description="Plan nodes")


class AnalysisResult(BaseModel):
    """Model for query analysis results."""
    
    id: Optional[UUID] = Field(None, description="Unique identifier")
    query_hash: str = Field(..., description="Hash of the analyzed query")
    query_text: str = Field(..., description="The SQL query text")
    execution_plan: Optional[ExecutionPlan] = Field(None, description="Execution plan analysis")
    analysis_summary: Optional[str] = Field(None, description="AI-generated analysis summary")
    performance_score: Optional[int] = Field(None, ge=0, le=100, description="Performance score (0-100)")
    bottleneck_type: Optional[str] = Field(None, description="Type of performance bottleneck")
    bottleneck_details: Optional[Dict[str, Any]] = Field(None, description="Detailed bottleneck information")
    created_at: Optional[datetime] = Field(None, description="Analysis timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class Recommendation(BaseModel):
    """Model for optimization recommendations."""
    
    id: Optional[UUID] = Field(None, description="Unique identifier")
    query_hash: str = Field(..., description="Hash of the query this recommendation is for")
    recommendation_type: str = Field(..., description="Type of recommendation (index, rewrite, config)")
    title: str = Field(..., description="Short title for the recommendation")
    description: str = Field(..., description="Detailed description of the recommendation")
    sql_fix: Optional[str] = Field(None, description="SQL to apply the fix")
    estimated_improvement_percent: Optional[int] = Field(None, ge=0, le=100, description="Estimated improvement percentage")
    confidence_score: Optional[int] = Field(None, ge=0, le=100, description="Confidence in the recommendation (0-100)")
    risk_level: Optional[str] = Field(None, description="Risk level (low, medium, high)")
    applied: bool = Field(default=False, description="Whether the recommendation has been applied")
    applied_at: Optional[datetime] = Field(None, description="When the recommendation was applied")
    created_at: Optional[datetime] = Field(None, description="Recommendation creation timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class SandboxTest(BaseModel):
    """Model for sandbox test results."""
    
    id: Optional[UUID] = Field(None, description="Unique identifier")
    recommendation_id: UUID = Field(..., description="ID of the tested recommendation")
    original_performance: Dict[str, Any] = Field(..., description="Original query performance metrics")
    optimized_performance: Optional[Dict[str, Any]] = Field(None, description="Optimized query performance metrics")
    improvement_percent: Optional[int] = Field(None, ge=0, description="Actual improvement percentage")
    test_status: str = Field(..., description="Status of the test (pending, running, completed, failed)")
    test_results: Optional[Dict[str, Any]] = Field(None, description="Detailed test results")
    created_at: Optional[datetime] = Field(None, description="Test creation timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class HotQuery(BaseModel):
    """Model for hot queries (most expensive queries)."""
    
    query_hash: str = Field(..., description="Hash of the query")
    query_text: str = Field(..., description="The SQL query text")
    total_time: int = Field(..., description="Total execution time")
    calls: int = Field(..., description="Number of calls")
    mean_time: float = Field(..., description="Mean execution time")
    percentage_of_total_time: float = Field(..., description="Percentage of total database time")
    
    model_config = ConfigDict(from_attributes=True)


class MetricsSummary(BaseModel):
    """Model for aggregated metrics summary."""
    
    total_queries: int = Field(..., description="Total number of unique queries")
    total_execution_time: int = Field(..., description="Total execution time across all queries")
    average_query_time: float = Field(..., description="Average execution time per query")
    slowest_query: Optional[HotQuery] = Field(None, description="Slowest query")
    most_called_query: Optional[HotQuery] = Field(None, description="Most frequently called query")
    top_queries: List[HotQuery] = Field(default_factory=list, description="Top N most expensive queries")
    last_updated: datetime = Field(..., description="Last metrics update timestamp")
    
    model_config = ConfigDict(from_attributes=True)


class HealthCheck(BaseModel):
    """Model for health check response."""
    
    status: str = Field(..., description="Health status (healthy, unhealthy)")
    timestamp: datetime = Field(..., description="Health check timestamp")
    database: bool = Field(..., description="Database connection status")
    openai: bool = Field(..., description="OpenAI API status")
    version: str = Field(..., description="Application version")
    uptime: float = Field(..., description="Application uptime in seconds")


class WebSocketMessage(BaseModel):
    """Model for WebSocket messages."""
    
    type: str = Field(..., description="Message type")
    data: Dict[str, Any] = Field(..., description="Message data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")


# API Response models
class APIResponse(BaseModel):
    """Base model for API responses."""
    
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class MetricsResponse(APIResponse):
    """Response model for metrics endpoints."""
    
    data: Optional[MetricsSummary] = Field(None, description="Metrics summary data")


class RecommendationsResponse(APIResponse):
    """Response model for recommendations endpoints."""
    
    data: Optional[List[Recommendation]] = Field(None, description="List of recommendations")


class AnalysisResponse(APIResponse):
    """Response model for analysis endpoints."""
    
    data: Optional[AnalysisResult] = Field(None, description="Analysis result data") 