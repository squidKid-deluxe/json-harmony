
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServerControls from './ServerControls';
import ClientsTable from './ClientsTable';
import PerformanceChart from './PerformanceChart';
import MatrixVisualizer from './MatrixVisualizer';
import { useWebSocket } from '@/utils/websocketContext';

const Dashboard: React.FC = () => {
  const { serverStatus } = useWebSocket();
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">JSON Harmony</h1>
        <p className="text-muted-foreground">
          Distributed Computing System for Neural Network Operations
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-100 rounded-lg p-4 text-center">
          <h2 className="text-sm text-blue-800 mb-1">Clients</h2>
          <p className="text-3xl font-bold text-blue-600">
            {serverStatus?.clients.length || 0}
          </p>
        </div>
        
        <div className="bg-green-100 rounded-lg p-4 text-center">
          <h2 className="text-sm text-green-800 mb-1">Completed Tasks</h2>
          <p className="text-3xl font-bold text-green-600">
            {serverStatus?.totalCompletedTasks || 0}
          </p>
        </div>
        
        <div className="bg-purple-100 rounded-lg p-4 text-center">
          <h2 className="text-sm text-purple-800 mb-1">Avg. Latency</h2>
          <p className="text-3xl font-bold text-purple-600">
            {serverStatus?.averageLatency ? `${serverStatus.averageLatency.toFixed(1)}ms` : 'N/A'}
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="control">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="control">Control Panel</TabsTrigger>
          <TabsTrigger value="clients">Connected Clients</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="control" className="space-y-4">
          <ServerControls />
          <MatrixVisualizer />
        </TabsContent>
        
        <TabsContent value="clients">
          <ClientsTable />
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceChart />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
