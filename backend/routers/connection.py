from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import asyncpg
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

from connection_manager import connection_manager

router = APIRouter()

class ConnectionTestRequest(BaseModel):
    host: Optional[str] = None
    port: Optional[str] = None
    database: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    ssl: Optional[bool] = False
    connection_string: Optional[str] = None

class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None

class ConnectionStatusResponse(BaseModel):
    connected: bool
    current_config: Optional[Dict[str, Any]] = None
    connection_history: list = []

class ConnectionSwitchRequest(BaseModel):
    host: str
    port: str
    database: str
    username: str
    password: str
    ssl: Optional[bool] = False

@router.post("/test", response_model=ConnectionTestResponse)
async def test_connection(request: ConnectionTestRequest):
    """Test database connection and check for pg_stat_statements extension."""
    
    # Parse connection string or build from components
    if request.connection_string:
        # For connection string, we need to parse it to get config
        try:
            # Simple parsing - in production, use proper URL parsing
            url = request.connection_string
            if url.startswith("postgresql://"):
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
                        
                        config = {
                            "host": host,
                            "port": port,
                            "database": db,
                            "user": user,
                            "password": password
                        }
                    else:
                        raise ValueError("Invalid connection string format")
                else:
                    raise ValueError("Invalid connection string format")
            else:
                raise ValueError("Invalid connection string format")
        except Exception as e:
            return ConnectionTestResponse(
                success=False,
                message=f"Invalid connection string: {str(e)}"
            )
    else:
        # Build config from individual components
        config = {
            "host": request.host or "localhost",
            "port": int(request.port) if request.port else 5432,
            "database": request.database or "postgres",
            "user": request.username or "postgres",
            "password": request.password or ""
        }
    
    # Test the connection using the connection manager
    result = await connection_manager.test_connection(config)
    return ConnectionTestResponse(**result)

@router.post("/switch", response_model=ConnectionTestResponse)
async def switch_database(request: ConnectionSwitchRequest):
    """Switch to a new database connection."""
    
    config = {
        "host": request.host,
        "port": int(request.port),
        "database": request.database,
        "user": request.username,
        "password": request.password
    }
    
    # Test the connection first
    test_result = await connection_manager.test_connection(config)
    if not test_result['success']:
        return ConnectionTestResponse(**test_result)
    
    # Switch to the new connection
    success = await connection_manager.connect(config)
    
    if success:
        return ConnectionTestResponse(
            success=True,
            message=f"Successfully connected to {config['host']}:{config['port']}/{config['database']}",
            details=test_result['details']
        )
    else:
        return ConnectionTestResponse(
            success=False,
            message="Failed to establish connection"
        )

@router.get("/status", response_model=ConnectionStatusResponse)
async def get_connection_status():
    """Get current connection status and history."""
    
    current_config = connection_manager.get_current_config()
    history = connection_manager.get_connection_history()
    
    return ConnectionStatusResponse(
        connected=connection_manager.is_connected(),
        current_config=current_config,
        connection_history=history
    )

@router.post("/disconnect")
async def disconnect_database():
    """Disconnect from the current database."""
    
    await connection_manager.disconnect()
    
    return {
        "success": True,
        "message": "Disconnected from database"
    }

@router.post("/connect")
async def connect_database(request: ConnectionTestRequest):
    """Establish a persistent connection to the database."""
    # This endpoint is now deprecated in favor of /switch
    # For backward compatibility, we'll redirect to /switch
    
    if not request.connection_string and not all([request.host, request.database, request.username]):
        raise HTTPException(
            status_code=400,
            detail="Either connection_string or host, database, and username are required"
        )
    
    # Convert to switch request format
    if request.connection_string:
        # Parse connection string
        url = request.connection_string
        if url.startswith("postgresql://"):
            parts = url.replace("postgresql://", "").split("@")
            if len(parts) == 2:
                auth, rest = parts
                user_pass = auth.split(":")
                host_port_db = rest.split("/")
                if len(host_port_db) == 2:
                    host_port, db = host_port_db
                    host_port_parts = host_port.split(":")
                    host = host_port_parts[0]
                    port = host_port_parts[1] if len(host_port_parts) > 1 else "5432"
                    user = user_pass[0]
                    password = user_pass[1] if len(user_pass) > 1 else ""
                    
                    switch_request = ConnectionSwitchRequest(
                        host=host,
                        port=port,
                        database=db,
                        username=user,
                        password=password,
                        ssl=request.ssl
                    )
                else:
                    raise HTTPException(status_code=400, detail="Invalid connection string")
            else:
                raise HTTPException(status_code=400, detail="Invalid connection string")
        else:
            raise HTTPException(status_code=400, detail="Invalid connection string")
    else:
        switch_request = ConnectionSwitchRequest(
            host=request.host or "localhost",
            port=request.port or "5432",
            database=request.database or "postgres",
            username=request.username or "postgres",
            password=request.password or "",
            ssl=request.ssl
        )
    
    # Use the switch endpoint
    return await switch_database(switch_request) 