"""
Configuration module for OptiSchema backend.
Handles environment variables and application settings.
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database Configuration
    database_url: str = Field(..., env="DATABASE_URL")
    
    # OpenAI Configuration
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-4o", env="OPENAI_MODEL")
    
    # Backend Configuration
    backend_host: str = Field(default="0.0.0.0", env="BACKEND_HOST")
    backend_port: int = Field(default=8000, env="BACKEND_PORT")
    backend_reload: bool = Field(default=True, env="BACKEND_RELOAD")
    
    # Environment Configuration
    environment: str = Field(default="development", env="ENVIRONMENT")
    debug: bool = Field(default=True, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Cache Configuration
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")  # 1 hour
    cache_size: int = Field(default=1000, env="CACHE_SIZE")
    
    # Analysis Configuration
    polling_interval: int = Field(default=30, env="POLLING_INTERVAL")  # seconds
    top_queries_limit: int = Field(default=10, env="TOP_QUERIES_LIMIT")
    analysis_interval: int = Field(default=60, env="ANALYSIS_INTERVAL")  # seconds
    
    # WebSocket Configuration
    ui_ws_url: str = Field(default="ws://localhost:8000/ws", env="UI_WS_URL")
    
    # Sandbox Configuration (optional)
    sandbox_database_url: Optional[str] = Field(default=None, env="SANDBOX_DATABASE_URL")
    
    gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")
    deepseek_api_key: str = Field(default="", env="DEEPSEEK_API_KEY")
    llm_provider: str = Field(default="gemini", env="LLM_PROVIDER")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get the global settings instance."""
    return settings


# Database connection string parser
def get_database_config():
    """Parse database URL and return connection parameters."""
    # This is a simple parser - in production, you might want to use URL parsing
    url = settings.database_url
    if url.startswith("postgresql://"):
        # Extract components from postgresql://user:pass@host:port/db
        parts = url.replace("postgresql://", "").split("@")
        if len(parts) == 2:
            auth, rest = parts
            user_pass = auth.split(":")
            host_port_db = rest.split("/")
            if len(host_port_db) == 2:
                host_port, db = host_port_db
                host_port_parts = host_port.split(":")
                host = host_port_parts[0]
                port = int(host_port_parts[1]) if len(host_port_parts) > 1 else 5432
                user = user_pass[0]
                password = user_pass[1] if len(user_pass) > 1 else ""
                
                return {
                    "host": host,
                    "port": port,
                    "database": db,
                    "user": user,
                    "password": password
                }
    
    # No fallback - require explicit configuration
    raise ValueError("No database configuration found. Please set DATABASE_URL or individual database environment variables.") 