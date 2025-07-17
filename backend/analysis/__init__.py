"""
Analysis package for OptiSchema backend.
Contains query analysis, execution plan analysis, and optimization heuristics.
"""

from .core import analyze_queries, identify_hot_queries, calculate_performance_metrics
from .explain import analyze_execution_plan, extract_plan_metrics

__all__ = [
    'analyze_queries',
    'identify_hot_queries', 
    'calculate_performance_metrics',
    'analyze_execution_plan',
    'extract_plan_metrics'
] 