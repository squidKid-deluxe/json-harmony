
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWebSocket } from '@/utils/websocketContext';

const generateRandomData = (count: number, baseline: number) => {
  return Array.from({ length: count }, (_, i) => ({
    time: i,
    value: baseline + Math.random() * 20 - 10,
  }));
};

const PerformanceChart: React.FC = () => {
  const { serverStatus } = useWebSocket();
  const [latencyData, setLatencyData] = useState<Array<{ time: number; value: number }>>([]);
  const [throughputData, setThroughputData] = useState<Array<{ time: number; value: number }>>([]);

  useEffect(() => {
    if (serverStatus?.running) {
      // Initialize with some data
      setLatencyData(generateRandomData(20, serverStatus.averageLatency || 30));
      setThroughputData(generateRandomData(20, 100));

      // Update data periodically
      const interval = setInterval(() => {
        setLatencyData(prev => {
          const newPoint = { time: prev.length, value: (serverStatus.averageLatency || 30) + Math.random() * 20 - 10 };
          return [...prev.slice(1), newPoint];
        });
        
        setThroughputData(prev => {
          const newPoint = { time: prev.length, value: 100 + Math.random() * 40 - 20 };
          return [...prev.slice(1), newPoint];
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [serverStatus?.running, serverStatus?.averageLatency]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Network Latency</CardTitle>
          <CardDescription>Average round-trip time in milliseconds</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                label={{ value: 'ms', angle: -90, position: 'insideLeft' }} 
                domain={[0, 'auto']}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0ea5e9" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Computation Throughput</CardTitle>
          <CardDescription>Distributed operations per second</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                label={{ value: 'ops/s', angle: -90, position: 'insideLeft' }} 
                domain={[0, 'auto']}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceChart;
