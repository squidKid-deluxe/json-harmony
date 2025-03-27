
import React from 'react';
import Dashboard from '@/components/Dashboard';
import { WebSocketProvider } from '@/utils/websocketContext';

const Index = () => {
  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-50">
        <Dashboard />
      </div>
    </WebSocketProvider>
  );
};

export default Index;
