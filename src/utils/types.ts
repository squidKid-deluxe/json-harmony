
export interface Client {
  id: string;
  name: string;
  status: "idle" | "computing" | "disconnected";
  cores: number;
  performance: number; // operations per second
  lastSeen: Date;
}

export interface Task {
  id: string;
  type: "dot_product";
  status: "pending" | "processing" | "completed" | "failed";
  assignedTo: string | null;
  result: number[] | null;
  startTime: Date | null;
  endTime: Date | null;
  dimensions: {
    matrixA: [number, number]; // [rows, cols]
    matrixB: [number, number]; // [rows, cols]
  };
}

export interface ServerStatus {
  running: boolean;
  startTime: Date | null;
  totalCompletedTasks: number;
  totalFailedTasks: number;
  averageLatency: number;
  clients: Client[];
  activeTasks: Task[];
}
