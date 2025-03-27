
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ServerStatus, Task, Client } from './types';

interface WebSocketContextType {
  serverStatus: ServerStatus | null;
  startServer: () => void;
  stopServer: () => void;
  createTask: (dimensions: { matrixA: [number, number]; matrixB: [number, number] }) => void;
  isConnected: boolean;
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  serverStatus: null,
  startServer: () => {},
  stopServer: () => {},
  createTask: () => {},
  isConnected: false,
  error: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    // In a real implementation, we would connect to our Python server
    // For demo purposes, we'll simulate a WebSocket connection
    const simulateConnection = () => {
      console.log("Simulating WebSocket connection");
      setIsConnected(true);
      
      // Simulate initial server status
      const mockServerStatus: ServerStatus = {
        running: true,
        startTime: new Date(),
        totalCompletedTasks: 0,
        totalFailedTasks: 0,
        averageLatency: 0,
        clients: [],
        activeTasks: [],
      };
      
      setServerStatus(mockServerStatus);
      
      // Simulate clients connecting
      setTimeout(() => {
        if (mockServerStatus) {
          mockServerStatus.clients = [
            {
              id: "client-1",
              name: "Worker Node 1",
              status: "idle",
              cores: 4,
              performance: 0,
              lastSeen: new Date(),
            },
            {
              id: "client-2",
              name: "Worker Node 2",
              status: "idle",
              cores: 8,
              performance: 0,
              lastSeen: new Date(),
            },
          ];
          setServerStatus({ ...mockServerStatus });
        }
      }, 2000);
    };
    
    simulateConnection();
    
    return () => {
      setIsConnected(false);
    };
  }, []);

  const startServer = () => {
    if (serverStatus) {
      setServerStatus({
        ...serverStatus,
        running: true,
        startTime: new Date(),
      });
      console.log("Server started");
    }
  };

  const stopServer = () => {
    if (serverStatus) {
      setServerStatus({
        ...serverStatus,
        running: false,
      });
      console.log("Server stopped");
    }
  };

  const createTask = (dimensions: { matrixA: [number, number]; matrixB: [number, number] }) => {
    if (serverStatus) {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        type: "dot_product",
        status: "pending",
        assignedTo: null,
        result: null,
        startTime: null,
        endTime: null,
        dimensions,
      };
      
      const updatedTasks = [...serverStatus.activeTasks, newTask];
      setServerStatus({
        ...serverStatus,
        activeTasks: updatedTasks,
      });
      
      // Simulate task assignment and completion
      simulateTaskExecution(newTask);
      
      console.log("Task created:", newTask);
    }
  };

  const simulateTaskExecution = (task: Task) => {
    // Simulate task assignment
    setTimeout(() => {
      if (serverStatus) {
        const clients = [...serverStatus.activeTasks];
        const taskIndex = clients.findIndex(t => t.id === task.id);
        
        if (taskIndex !== -1) {
          const updatedTask = { ...task };
          updatedTask.status = "processing";
          updatedTask.assignedTo = serverStatus.clients[0]?.id || null;
          updatedTask.startTime = new Date();
          
          const updatedTasks = [...serverStatus.activeTasks];
          updatedTasks[taskIndex] = updatedTask;
          
          // Update client status
          const updatedClients = [...serverStatus.clients];
          const clientIndex = updatedClients.findIndex(c => c.id === updatedTask.assignedTo);
          if (clientIndex !== -1) {
            updatedClients[clientIndex] = {
              ...updatedClients[clientIndex],
              status: "computing",
            };
          }
          
          setServerStatus({
            ...serverStatus,
            activeTasks: updatedTasks,
            clients: updatedClients,
          });
          
          // Simulate task completion
          setTimeout(() => {
            if (serverStatus) {
              const completedTask = { ...updatedTask };
              completedTask.status = "completed";
              completedTask.endTime = new Date();
              completedTask.result = Array(task.dimensions.matrixA[0]).fill(Math.random() * 10);
              
              const finalTasks = serverStatus.activeTasks.filter(t => t.id !== task.id);
              
              // Update client status back to idle
              const finalClients = [...serverStatus.clients];
              const finalClientIndex = finalClients.findIndex(c => c.id === completedTask.assignedTo);
              if (finalClientIndex !== -1) {
                finalClients[finalClientIndex] = {
                  ...finalClients[finalClientIndex],
                  status: "idle",
                  performance: Math.random() * 1000 + 500,
                };
              }
              
              setServerStatus({
                ...serverStatus,
                activeTasks: finalTasks,
                clients: finalClients,
                totalCompletedTasks: serverStatus.totalCompletedTasks + 1,
                averageLatency: Math.random() * 50 + 10,
              });
            }
          }, 3000 + Math.random() * 3000);
        }
      }
    }, 1000);
  };

  return (
    <WebSocketContext.Provider
      value={{
        serverStatus,
        startServer,
        stopServer,
        createTask,
        isConnected,
        error,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
