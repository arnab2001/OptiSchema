"""
WebSocket implementation for OptiSchema backend.
Handles real-time communication for live dashboard updates.
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import Dict, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from models import WebSocketMessage

logger = logging.getLogger(__name__)

# Global WebSocket connection management
websocket_connections: Dict[str, WebSocket] = {}
subscriptions: Dict[str, Set[str]] = {}  # connection_id -> set of subscription types


class WebSocketManager:
    """Manages WebSocket connections and subscriptions."""
    
    def __init__(self):
        self.connections = websocket_connections
        self.subscriptions = subscriptions
    
    async def connect(self, websocket: WebSocket) -> str:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        # Generate unique connection ID
        connection_id = f"ws_{int(time.time() * 1000)}_{id(websocket)}"
        self.connections[connection_id] = websocket
        self.subscriptions[connection_id] = set()
        
        logger.info(f"WebSocket connection established: {connection_id}")
        return connection_id
    
    def disconnect(self, connection_id: str):
        """Remove a WebSocket connection."""
        if connection_id in self.connections:
            del self.connections[connection_id]
        if connection_id in self.subscriptions:
            del self.subscriptions[connection_id]
        logger.info(f"WebSocket connection removed: {connection_id}")
    
    async def send_message(self, connection_id: str, message: WebSocketMessage):
        """Send a message to a specific connection."""
        if connection_id in self.connections:
            try:
                websocket = self.connections[connection_id]
                await websocket.send_text(message.model_dump_json())
            except Exception as e:
                logger.error(f"Failed to send message to {connection_id}: {e}")
                self.disconnect(connection_id)
    
    async def broadcast(self, message: WebSocketMessage, subscription_type: str = None):
        """Broadcast a message to all connections (optionally filtered by subscription)."""
        if not self.connections:
            return
        
        message_json = message.model_dump_json()
        disconnected = []
        
        for connection_id, websocket in self.connections.items():
            try:
                # If subscription type is specified, only send to subscribed connections
                if subscription_type and connection_id in self.subscriptions:
                    if subscription_type not in self.subscriptions[connection_id]:
                        continue
                
                await websocket.send_text(message_json)
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")
                disconnected.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected:
            self.disconnect(connection_id)
    
    def subscribe(self, connection_id: str, subscription_type: str):
        """Subscribe a connection to a specific type of updates."""
        if connection_id in self.subscriptions:
            self.subscriptions[connection_id].add(subscription_type)
            logger.info(f"Connection {connection_id} subscribed to {subscription_type}")
    
    def unsubscribe(self, connection_id: str, subscription_type: str):
        """Unsubscribe a connection from a specific type of updates."""
        if connection_id in self.subscriptions:
            self.subscriptions[connection_id].discard(subscription_type)
            logger.info(f"Connection {connection_id} unsubscribed from {subscription_type}")


# Global WebSocket manager instance
ws_manager = WebSocketManager()


async def handle_websocket_connection(websocket: WebSocket):
    """Handle a WebSocket connection lifecycle."""
    connection_id = await ws_manager.connect(websocket)
    
    try:
        # Send welcome message
        welcome_message = WebSocketMessage(
            type="connection_established",
            data={
                "connection_id": connection_id,
                "message": "Connected to OptiSchema WebSocket",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        await ws_manager.send_message(connection_id, welcome_message)
        
        # Keep connection alive and handle messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                
                # Parse and handle message
                await handle_websocket_message(connection_id, data)
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket connection closed: {connection_id}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
    
    finally:
        # Clean up connection
        ws_manager.disconnect(connection_id)


async def handle_websocket_message(connection_id: str, data: str):
    """Handle incoming WebSocket messages."""
    try:
        message = WebSocketMessage.model_validate_json(data)
        logger.info(f"Received WebSocket message from {connection_id}: {message.type}")
        
        # Handle different message types
        if message.type == "ping":
            response = WebSocketMessage(
                type="pong",
                data={
                    "timestamp": datetime.utcnow().isoformat(),
                    "connection_id": connection_id
                }
            )
            await ws_manager.send_message(connection_id, response)
        
        elif message.type == "subscribe_metrics":
            ws_manager.subscribe(connection_id, "metrics")
            response = WebSocketMessage(
                type="subscription_confirmed",
                data={
                    "subscription": "metrics",
                    "connection_id": connection_id
                }
            )
            await ws_manager.send_message(connection_id, response)
        
        elif message.type == "subscribe_recommendations":
            ws_manager.subscribe(connection_id, "recommendations")
            response = WebSocketMessage(
                type="subscription_confirmed",
                data={
                    "subscription": "recommendations",
                    "connection_id": connection_id
                }
            )
            await ws_manager.send_message(connection_id, response)
        
        elif message.type == "subscribe_analysis":
            ws_manager.subscribe(connection_id, "analysis")
            response = WebSocketMessage(
                type="subscription_confirmed",
                data={
                    "subscription": "analysis",
                    "connection_id": connection_id
                }
            )
            await ws_manager.send_message(connection_id, response)
        
        elif message.type == "unsubscribe":
            subscription_type = message.data.get("subscription_type")
            if subscription_type:
                ws_manager.unsubscribe(connection_id, subscription_type)
                response = WebSocketMessage(
                    type="unsubscription_confirmed",
                    data={
                        "subscription": subscription_type,
                        "connection_id": connection_id
                    }
                )
                await ws_manager.send_message(connection_id, response)
        
        else:
            # Unknown message type
            response = WebSocketMessage(
                type="error",
                data={
                    "error": f"Unknown message type: {message.type}",
                    "connection_id": connection_id
                }
            )
            await ws_manager.send_message(connection_id, response)
    
    except Exception as e:
        logger.error(f"Error processing WebSocket message from {connection_id}: {e}")
        error_message = WebSocketMessage(
            type="error",
            data={
                "error": "Invalid message format",
                "connection_id": connection_id
            }
        )
        await ws_manager.send_message(connection_id, error_message)


# Real-time update functions
async def broadcast_metrics_update(metrics_data: Dict[str, Any]):
    """Broadcast metrics update to subscribed clients."""
    message = WebSocketMessage(
        type="metrics_update",
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": metrics_data
        }
    )
    await ws_manager.broadcast(message, "metrics")


async def broadcast_recommendation_update(recommendation_data: Dict[str, Any]):
    """Broadcast recommendation update to subscribed clients."""
    message = WebSocketMessage(
        type="recommendation_update",
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "recommendation": recommendation_data
        }
    )
    await ws_manager.broadcast(message, "recommendations")


async def broadcast_analysis_update(analysis_data: Dict[str, Any]):
    """Broadcast analysis update to subscribed clients."""
    message = WebSocketMessage(
        type="analysis_update",
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "analysis": analysis_data
        }
    )
    await ws_manager.broadcast(message, "analysis")


async def broadcast_system_status(status_data: Dict[str, Any]):
    """Broadcast system status update to all clients."""
    message = WebSocketMessage(
        type="system_status",
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "status": status_data
        }
    )
    await ws_manager.broadcast(message)


# Background task for periodic updates
async def periodic_updates_task():
    """Background task that sends periodic updates to WebSocket clients."""
    while True:
        try:
            # Send system status every 30 seconds
            status_data = {
                "active_connections": len(ws_manager.connections),
                "total_subscriptions": sum(len(subs) for subs in ws_manager.subscriptions.values()),
                "uptime": time.time() - time.time()  # TODO: Get actual uptime
            }
            await broadcast_system_status(status_data)
            
            # Wait 30 seconds before next update
            await asyncio.sleep(30)
            
        except Exception as e:
            logger.error(f"Error in periodic updates task: {e}")
            await asyncio.sleep(30)  # Continue even if there's an error 