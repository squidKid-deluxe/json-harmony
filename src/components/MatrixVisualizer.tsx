
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebSocket } from '@/utils/websocketContext';

const MatrixVisualizer: React.FC = () => {
  const { serverStatus } = useWebSocket();
  
  const getRandomMatrix = (rows: number, cols: number) => {
    return Array.from({ length: Math.min(rows, 8) }, () => 
      Array.from({ length: Math.min(cols, 8) }, () => 
        Math.floor(Math.random() * 10)
      )
    );
  };
  
  const getRandomResult = (size: number) => {
    return Array.from({ length: Math.min(size, 8) }, () => 
      Math.floor(Math.random() * 100)
    );
  };
  
  // Get the latest active task or use a placeholder
  const latestTask = serverStatus?.activeTasks[0];
  
  const matrixA = latestTask ? 
    getRandomMatrix(latestTask.dimensions.matrixA[0], latestTask.dimensions.matrixA[1]) :
    getRandomMatrix(4, 4);
    
  const matrixB = latestTask ? 
    getRandomMatrix(latestTask.dimensions.matrixB[0], latestTask.dimensions.matrixB[1]) :
    getRandomMatrix(4, 4);
    
  const resultMatrix = latestTask?.result || 
    getRandomResult(latestTask?.dimensions.matrixA[0] || 4);
  
  const renderMatrixCell = (value: number) => (
    <div className="flex items-center justify-center h-8 w-8 bg-slate-200 rounded">
      {value}
    </div>
  );
  
  const renderMatrix = (matrix: number[][]) => (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, 1fr)` }}>
      {matrix.flatMap((row, i) => 
        row.map((cell, j) => (
          <React.Fragment key={`${i}-${j}`}>
            {renderMatrixCell(cell)}
          </React.Fragment>
        ))
      )}
    </div>
  );
  
  const renderResultVector = (results: number[]) => (
    <div className="flex flex-col gap-1">
      {results.map((value, i) => (
        <div key={i} className="flex items-center justify-center h-8 w-16 bg-blue-200 rounded">
          {value}
        </div>
      ))}
    </div>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Matrix Operation Visualization</CardTitle>
        <CardDescription>
          Visual representation of current dot product operation
          {latestTask ? ` (${latestTask.dimensions.matrixA[0]}x${latestTask.dimensions.matrixA[1]} * ${latestTask.dimensions.matrixB[0]}x${latestTask.dimensions.matrixB[1]})` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div>
            <p className="text-sm text-center mb-2">Matrix A (Partial View)</p>
            {renderMatrix(matrixA)}
            {matrixA.length < (latestTask?.dimensions.matrixA[0] || 4) && (
              <p className="text-xs text-center mt-1 text-muted-foreground">
                ...and {(latestTask?.dimensions.matrixA[0] || 4) - matrixA.length} more rows
              </p>
            )}
          </div>
          
          <div className="text-2xl font-bold">×</div>
          
          <div>
            <p className="text-sm text-center mb-2">Matrix B (Partial View)</p>
            {renderMatrix(matrixB)}
            {matrixB.length < (latestTask?.dimensions.matrixB[0] || 4) && (
              <p className="text-xs text-center mt-1 text-muted-foreground">
                ...and {(latestTask?.dimensions.matrixB[0] || 4) - matrixB.length} more rows
              </p>
            )}
          </div>
          
          <div className="text-2xl font-bold">=</div>
          
          <div>
            <p className="text-sm text-center mb-2">Result (Partial View)</p>
            {renderResultVector(resultMatrix)}
            {resultMatrix.length < (latestTask?.dimensions.matrixA[0] || 4) && (
              <p className="text-xs text-center mt-1 text-muted-foreground">
                ...and {(latestTask?.dimensions.matrixA[0] || 4) - resultMatrix.length} more values
              </p>
            )}
          </div>
        </div>
        
        <div className="mt-4 text-sm text-center text-muted-foreground">
          {latestTask ? (
            <p>Task status: {latestTask.status}</p>
          ) : (
            <p>No active task. Create one to see real-time visualization.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatrixVisualizer;
