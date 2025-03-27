
#!/usr/bin/env python3
"""
JSON Harmony - Distributed Computing Server

Distributes dot product computations across connected clients.
"""

import asyncio
import json
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union

import websockets

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('json-harmony-server')

# Type definitions
ClientInfo = Dict[str, Union[str, int, float]]
Task = Dict[str, Union[str, Dict, List, None]]

class DistributedComputeServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.client_info: Dict[str, ClientInfo] = {}
        self.tasks: Dict[str, Task] = {}
        self.pending_tasks: List[str] = []
        self.start_time = None
        self.total_completed_tasks = 0
        self.total_failed_tasks = 0
        self.latencies: List[float] = []
        
    async def register_client(self, websocket: websockets.WebSocketServerProtocol, client_id: str, info: ClientInfo):
        """Register a new client connection"""
        self.clients[client_id] = websocket
        self.client_info[client_id] = info
        self.client_info[client_id]["status"] = "idle"
        self.client_info[client_id]["last_seen"] = time.time()
        logger.info(f"Registered client {client_id}: {info}")
        
        # Notify clients about new connection
        await self.broadcast_server_status()
    
    async def unregister_client(self, client_id: str):
        """Remove a client connection"""
        if client_id in self.clients:
            del self.clients[client_id]
            if client_id in self.client_info:
                # Mark tasks assigned to this client as pending again
                for task_id, task in self.tasks.items():
                    if task.get("assignedTo") == client_id and task["status"] == "processing":
                        task["status"] = "pending"
                        task["assignedTo"] = None
                        self.pending_tasks.append(task_id)
                
                del self.client_info[client_id]
                logger.info(f"Unregistered client {client_id}")
                
                # Notify remaining clients
                await self.broadcast_server_status()
    
    async def create_task(self, task_type: str, dimensions: Dict):
        """Create a new dot product computation task"""
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "type": task_type,
            "status": "pending",
            "assignedTo": None,
            "result": None,
            "startTime": None,
            "endTime": None,
            "dimensions": dimensions,
            "created": time.time()
        }
        self.tasks[task_id] = task
        self.pending_tasks.append(task_id)
        logger.info(f"Created new task: {task_id}")
        
        # Try to assign the task immediately if clients are available
        await self.assign_pending_tasks()
        
        # Notify clients about new task
        await self.broadcast_server_status()
        
        return task_id
    
    async def assign_pending_tasks(self):
        """Assign pending tasks to available clients"""
        if not self.pending_tasks:
            return
            
        # Find idle clients
        idle_clients = [
            client_id for client_id, info in self.client_info.items()
            if info["status"] == "idle"
        ]
        
        if not idle_clients:
            return
            
        # Simple round-robin assignment
        for task_id in list(self.pending_tasks):
            if not idle_clients:
                break
                
            client_id = idle_clients.pop(0)
            task = self.tasks[task_id]
            
            try:
                # Prepare task for client
                task_message = {
                    "type": "task",
                    "task_id": task_id,
                    "operation": task["type"],
                    "dimensions": task["dimensions"]
                }
                
                await self.clients[client_id].send(json.dumps(task_message))
                
                # Update task and client status
                task["status"] = "processing"
                task["assignedTo"] = client_id
                task["startTime"] = time.time()
                self.client_info[client_id]["status"] = "computing"
                self.pending_tasks.remove(task_id)
                
                logger.info(f"Assigned task {task_id} to client {client_id}")
                
            except Exception as e:
                logger.error(f"Error assigning task to client: {e}")
                # Move client back to idle list if it's still connected
                if client_id in self.client_info:
                    self.client_info[client_id]["status"] = "idle"
                    idle_clients.append(client_id)
        
        # Notify clients about changes
        await self.broadcast_server_status()
    
    async def handle_task_result(self, client_id: str, task_id: str, result, execution_time: float):
        """Process completed task results from a client"""
        if task_id not in self.tasks:
            logger.warning(f"Received result for unknown task {task_id}")
            return
            
        task = self.tasks[task_id]
        
        if task["assignedTo"] != client_id:
            logger.warning(f"Received result from {client_id} for task assigned to {task['assignedTo']}")
            return
            
        # Update task
        task["status"] = "completed"
        task["result"] = result
        task["endTime"] = time.time()
        
        # Update client
        self.client_info[client_id]["status"] = "idle"
        self.client_info[client_id]["last_seen"] = time.time()
        
        # Update server stats
        self.total_completed_tasks += 1
        self.latencies.append(execution_time)
        
        logger.info(f"Completed task {task_id} from client {client_id} in {execution_time:.2f}ms")
        
        # Assign new tasks if available
        await self.assign_pending_tasks()
        
        # Notify clients about task completion
        await self.broadcast_server_status()
    
    async def handle_client_message(self, websocket: websockets.WebSocketServerProtocol, client_id: str, message: Dict):
        """Process messages from clients"""
        msg_type = message.get("type")
        
        if msg_type == "register":
            await self.register_client(
                websocket, 
                client_id, 
                {
                    "name": message.get("name", "Unknown Client"),
                    "cores": message.get("cores", 1),
                    "performance": 0
                }
            )
            
        elif msg_type == "heartbeat":
            if client_id in self.client_info:
                self.client_info[client_id]["last_seen"] = time.time()
                
        elif msg_type == "task_result":
            task_id = message.get("task_id")
            result = message.get("result")
            execution_time = message.get("execution_time", 0)
            
            if task_id and result is not None:
                await self.handle_task_result(client_id, task_id, result, execution_time)
                
        elif msg_type == "error":
            task_id = message.get("task_id")
            error_msg = message.get("error", "Unknown error")
            
            if task_id in self.tasks:
                task = self.tasks[task_id]
                task["status"] = "failed"
                self.total_failed_tasks += 1
                logger.error(f"Task {task_id} failed on client {client_id}: {error_msg}")
                
                # Reset client status
                if client_id in self.client_info:
                    self.client_info[client_id]["status"] = "idle"
                
                await self.broadcast_server_status()
    
    async def broadcast_server_status(self):
        """Send server status to all connected clients"""
        # Calculate average latency
        avg_latency = sum(self.latencies[-100:]) / max(len(self.latencies[-100:]), 1) if self.latencies else 0
        
        status = {
            "type": "server_status",
            "running": self.start_time is not None,
            "startTime": self.start_time,
            "totalCompletedTasks": self.total_completed_tasks,
            "totalFailedTasks": self.total_failed_tasks,
            "averageLatency": avg_latency,
            "clients": [
                {
                    "id": client_id,
                    "name": info["name"],
                    "status": info["status"],
                    "cores": info["cores"],
                    "performance": info["performance"],
                    "lastSeen": info["last_seen"]
                }
                for client_id, info in self.client_info.items()
            ],
            "activeTasks": [
                task for task in self.tasks.values()
                if task["status"] in ["pending", "processing"]
            ]
        }
        
        message = json.dumps(status)
        for client in self.clients.values():
            try:
                await client.send(message)
            except Exception as e:
                logger.error(f"Error sending status update: {e}")
    
    async def handle_connection(self, websocket: websockets.WebSocketServerProtocol):
        """Handle a client websocket connection"""
        client_id = str(uuid.uuid4())
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_client_message(websocket, client_id, data)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from client {client_id}")
                except Exception as e:
                    logger.error(f"Error processing message from {client_id}: {e}")
                    
        except websockets.ConnectionClosed:
            logger.info(f"Connection closed for client {client_id}")
        finally:
            await self.unregister_client(client_id)
    
    async def monitor_clients(self):
        """Check for inactive clients and clean up"""
        while True:
            try:
                current_time = time.time()
                for client_id, info in list(self.client_info.items()):
                    if current_time - info["last_seen"] > 30:  # 30 seconds timeout
                        logger.warning(f"Client {client_id} timed out")
                        await self.unregister_client(client_id)
            except Exception as e:
                logger.error(f"Error in client monitor: {e}")
                
            await asyncio.sleep(10)
    
    async def start(self):
        """Start the WebSocket server"""
        self.start_time = time.time()
        
        server = await websockets.serve(
            self.handle_connection,
            self.host, 
            self.port
        )
        
        logger.info(f"Server started on ws://{self.host}:{self.port}")
        
        # Start background tasks
        asyncio.create_task(self.monitor_clients())
        
        return server
    
    def stop(self):
        """Stop the server"""
        self.start_time = None
        logger.info("Server stopped")


async def main():
    server = DistributedComputeServer()
    ws_server = await server.start()
    
    # Create a sample task to test with
    await server.create_task("dot_product", {
        "matrixA": [1000, 1000],
        "matrixB": [1000, 100]
    })
    
    try:
        # Keep the server running
        await asyncio.Future()
    except KeyboardInterrupt:
        logger.info("Server shutting down...")
        server.stop()


if __name__ == "__main__":
    asyncio.run(main())
