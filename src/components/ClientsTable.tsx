
import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from '@/utils/websocketContext';
import { Client } from '@/utils/types';

const ClientsTable: React.FC = () => {
  const { serverStatus } = useWebSocket();

  const getStatusBadge = (status: Client['status']) => {
    switch (status) {
      case 'computing':
        return <Badge className="bg-blue-500">Computing</Badge>;
      case 'idle':
        return <Badge className="bg-green-500">Idle</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>
          {serverStatus?.clients.length 
            ? `${serverStatus.clients.length} connected clients` 
            : 'No clients connected'}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cores</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Last Seen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {serverStatus?.clients.length ? (
            serverStatus.clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-mono">{client.id}</TableCell>
                <TableCell>{client.name}</TableCell>
                <TableCell>{getStatusBadge(client.status)}</TableCell>
                <TableCell>{client.cores}</TableCell>
                <TableCell>
                  {client.performance.toFixed(0)} ops/s
                </TableCell>
                <TableCell>{formatTimeSince(client.lastSeen)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No clients connected. Start the server and run client.py to connect.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;
