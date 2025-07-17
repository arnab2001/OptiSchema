"""
Routers package for OptiSchema backend.
Contains all API route definitions.
"""

from .metrics import router as metrics_router
from .suggestions import router as suggestions_router
from .analysis import router as analysis_router

__all__ = ["metrics_router", "suggestions_router", "analysis_router"] 