
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useWebSocket } from '@/utils/websocketContext';
import { useToast } from '@/components/ui/use-toast';

const ServerControls: React.FC = () => {
  const { serverStatus, startServer, stopServer, createTask } = useWebSocket();
  const { toast } = useToast();
  const [matrixARows, setMatrixARows] = useState<number>(100);
  const [matrixACols, setMatrixACols] = useState<number>(100);
  const [matrixBRows, setMatrixBRows] = useState<number>(100);
  const [matrixBCols, setMatrixBCols] = useState<number>(100);

  const handleToggleServer = () => {
    if (serverStatus?.running) {
      stopServer();
      toast({
        title: "Server Stopped",
        description: "Distributed computing server has been stopped.",
        variant: "default",
      });
    } else {
      startServer();
      toast({
        title: "Server Started",
        description: "Distributed computing server is now running.",
        variant: "default",
      });
    }
  };

  const handleCreateTask = () => {
    // Validate matrix dimensions for dot product (A cols must equal B rows)
    if (matrixACols !== matrixBRows) {
      toast({
        title: "Invalid Matrix Dimensions",
        description: "For dot product, columns of first matrix must equal rows of second matrix.",
        variant: "destructive",
      });
      return;
    }

    createTask({
      matrixA: [matrixARows, matrixACols],
      matrixB: [matrixBRows, matrixBCols],
    });

    toast({
      title: "Task Created",
      description: `Created dot product task with dimensions ${matrixARows}x${matrixACols} * ${matrixBRows}x${matrixBCols}`,
      variant: "default",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Server Control</CardTitle>
          <CardDescription>
            Start or stop the distributed computing server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={serverStatus?.running || false} 
              onCheckedChange={handleToggleServer} 
              id="server-switch"
            />
            <Label htmlFor="server-switch">
              Server is {serverStatus?.running ? 'running' : 'stopped'}
            </Label>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            {serverStatus?.running ? (
              <span>Server started at {serverStatus.startTime?.toLocaleTimeString()}</span>
            ) : (
              <span>Start the server to begin accepting clients</span>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Dot Product Task</CardTitle>
          <CardDescription>
            Define matrix dimensions for distributed computation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matrix-a-rows">Matrix A Rows</Label>
                <Input 
                  id="matrix-a-rows" 
                  type="number"
                  value={matrixARows}
                  onChange={(e) => setMatrixARows(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matrix-a-cols">Matrix A Columns</Label>
                <Input 
                  id="matrix-a-cols" 
                  type="number"
                  value={matrixACols}
                  onChange={(e) => setMatrixACols(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="matrix-b-rows">Matrix B Rows</Label>
                <Input 
                  id="matrix-b-rows" 
                  type="number"
                  value={matrixBRows}
                  onChange={(e) => setMatrixBRows(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="matrix-b-cols">Matrix B Columns</Label>
                <Input 
                  id="matrix-b-cols" 
                  type="number"
                  value={matrixBCols}
                  onChange={(e) => setMatrixBCols(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleCreateTask}
            disabled={!serverStatus?.running}
          >
            Create Task
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ServerControls;
