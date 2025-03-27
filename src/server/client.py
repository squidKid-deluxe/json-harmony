
#!/usr/bin/env python3
"""
JSON Harmony - Distributed Computing Client

Connects to a JSON Harmony server and performs distributed dot product operations.
"""

import asyncio
import json
import logging
import multiprocessing
import numpy as np
import platform
import random
import time
import uuid
import websockets
from typing import Dict, List, Optional, Tuple, Union

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('json-harmony-client')

class DistributedComputeClient:
    def __init__(self, server_url: str = "ws://localhost:8765", client_name: Optional[str] = None):
        self.server_url = server_url
        self.client_id = str(uuid.uuid4())
        self.client_name = client_name or f"{platform.node()}-{self.client_id[:8]}"
        self.websocket = None
        self.cores = multiprocessing.cpu_count()
        self.running = False
        self.task_queue = asyncio.Queue()
        self.current_task = None
        
    async def connect(self):
        """Connect to the server and register this client"""
        try:
            self.websocket = await websockets.connect(self.server_url)
            logger.info(f"Connected to server at {self.server_url}")
            
            # Register with the server
            await self.send_message({
                "type": "register",
                "client_id": self.client_id,
                "name": self.client_name,
                "cores": self.cores
            })
            
            self.running = True
            return True
            
        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False
    
    async def send_message(self, message: Dict):
        """Send a message to the server"""
        if not self.websocket:
            logger.error("Not connected to server")
            return
            
        try:
            await self.websocket.send(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            self.running = False
    
    async def send_heartbeat(self):
        """Send periodic heartbeats to the server"""
        while self.running:
            try:
                await self.send_message({
                    "type": "heartbeat",
                    "client_id": self.client_id
                })
            except Exception as e:
                logger.error(f"Error sending heartbeat: {e}")
                
            await asyncio.sleep(10)
    
    def perform_dot_product(self, dimensions: Dict) -> Tuple[List[float], float]:
        """
        Perform a dot product computation
        Returns the result and the time taken in milliseconds
        """
        try:
            # Extract dimensions
            matrix_a_rows = dimensions.get("matrixA", [100, 100])[0]
            matrix_a_cols = dimensions.get("matrixA", [100, 100])[1]
            matrix_b_rows = dimensions.get("matrixB", [100, 100])[0]
            matrix_b_cols = dimensions.get("matrixB", [100, 100])[1]
            
            # Ensure compatible dimensions
            if matrix_a_cols != matrix_b_rows:
                raise ValueError("Incompatible matrix dimensions for dot product")
                
            # Generate random matrices (in a real system, these would be received from the server)
            matrix_a = np.random.rand(matrix_a_rows, matrix_a_cols)
            matrix_b = np.random.rand(matrix_b_rows, matrix_b_cols)
            
            # Measure execution time
            start_time = time.time()
            
            # Perform dot product
            result = np.dot(matrix_a, matrix_b)
            
            # Convert to list for JSON serialization (return only first column for simplicity)
            result_list = result[:, 0].tolist()
            
            execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            logger.info(f"Dot product computed: {matrix_a_rows}x{matrix_a_cols} * {matrix_b_rows}x{matrix_b_cols}")
            logger.info(f"Execution time: {execution_time:.2f}ms")
            
            return result_list, execution_time
            
        except Exception as e:
            logger.error(f"Error in dot product computation: {e}")
            raise
    
    async def process_tasks(self):
        """Process tasks from the queue"""
        while self.running:
            try:
                task = await self.task_queue.get()
                self.current_task = task
                
                task_id = task.get("task_id")
                operation = task.get("operation")
                dimensions = task.get("dimensions")
                
                logger.info(f"Processing task {task_id}: {operation}")
                
                if operation == "dot_product":
                    try:
                        # Perform the computation
                        result, execution_time = self.perform_dot_product(dimensions)
                        
                        # Send the result back to the server
                        await self.send_message({
                            "type": "task_result",
                            "task_id": task_id,
                            "result": result,
                            "execution_time": execution_time
                        })
                        
                    except Exception as e:
                        logger.error(f"Error processing task {task_id}: {e}")
                        await self.send_message({
                            "type": "error",
                            "task_id": task_id,
                            "error": str(e)
                        })
                else:
                    logger.warning(f"Unsupported operation: {operation}")
                    await self.send_message({
                        "type": "error",
                        "task_id": task_id,
                        "error": f"Unsupported operation: {operation}"
                    })
                
                self.current_task = None
                self.task_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error in task processing: {e}")
                await asyncio.sleep(1)
    
    async def receive_messages(self):
        """Handle messages from the server"""
        if not self.websocket:
            return
            
        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")
                    
                    if msg_type == "task":
                        # Add task to processing queue
                        await self.task_queue.put(data)
                        
                    elif msg_type == "server_status":
                        # Process server status update if needed
                        pass
                        
                except json.JSONDecodeError:
                    logger.error("Received invalid JSON from server")
                    
        except websockets.ConnectionClosed:
            logger.info("Server connection closed")
            self.running = False
            
        except Exception as e:
            logger.error(f"Error receiving messages: {e}")
            self.running = False
    
    async def run(self):
        """Run the client"""
        if not await self.connect():
            return
            
        try:
            # Start background tasks
            heartbeat_task = asyncio.create_task(self.send_heartbeat())
            processing_task = asyncio.create_task(self.process_tasks())
            
            # Start receiving messages (this is the main loop)
            await self.receive_messages()
            
        except Exception as e:
            logger.error(f"Client error: {e}")
            
        finally:
            # Clean up
            self.running = False
            if self.websocket:
                await self.websocket.close()
                
            logger.info("Client shutting down")


async def main():
    # You can specify a different server URL here
    client = DistributedComputeClient()
    
    try:
        await client.run()
    except KeyboardInterrupt:
        logger.info("Client shutting down...")
        client.running = False


if __name__ == "__main__":
    asyncio.run(main())
