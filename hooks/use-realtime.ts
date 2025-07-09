'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface RealTimeData {
  users: any[];
  roles: any[];
  privileges: any[];
}

interface UpdateEvent {
  type: 'created' | 'updated' | 'deleted' | 'assigned' | 'removed';
  data: any;
  timestamp: string;
}

interface NotificationEvent {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export const useRealTime = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<RealTimeData>({
    users: [],
    roles: [],
    privileges: []
  });
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const socketIo = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');

    socketIo.on('connect', () => {
      console.log('🔌 Connected to real-time server');
      setIsConnected(true);
      
      // Join relevant rooms
      socketIo.emit('join-room', 'users');
      socketIo.emit('join-room', 'roles');
      socketIo.emit('join-room', 'privileges');
      socketIo.emit('join-room', 'user-roles');
      socketIo.emit('join-room', 'role-privileges');
      
      // Request initial data
      socketIo.emit('get-initial-data');
    });

    socketIo.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time server');
      setIsConnected(false);
    });

    // Handle initial data
    socketIo.on('initial-data', (initialData: RealTimeData) => {
      setData(initialData);
    });

    // Handle real-time updates
    socketIo.on('user-update', (event: UpdateEvent) => {
      setData(prev => {
        const newUsers = [...prev.users];
        
        switch (event.type) {
          case 'created':
            newUsers.push(event.data);
            break;
          case 'updated':
            const userIndex = newUsers.findIndex(u => u.user_id === event.data.user_id);
            if (userIndex !== -1) {
              newUsers[userIndex] = event.data;
            }
            break;
          case 'deleted':
            return {
              ...prev,
              users: newUsers.filter(u => u.user_id !== event.data.user_id)
            };
        }
        
        return { ...prev, users: newUsers };
      });
    });

    socketIo.on('role-update', (event: UpdateEvent) => {
      setData(prev => {
        const newRoles = [...prev.roles];
        
        switch (event.type) {
          case 'created':
            newRoles.push(event.data);
            break;
          case 'updated':
            const roleIndex = newRoles.findIndex(r => r.role_id === event.data.role_id);
            if (roleIndex !== -1) {
              newRoles[roleIndex] = event.data;
            }
            break;
          case 'deleted':
            return {
              ...prev,
              roles: newRoles.filter(r => r.role_id !== event.data.role_id)
            };
        }
        
        return { ...prev, roles: newRoles };
      });
    });

    socketIo.on('privilege-update', (event: UpdateEvent) => {
      setData(prev => {
        const newPrivileges = [...prev.privileges];
        
        switch (event.type) {
          case 'created':
            newPrivileges.push(event.data);
            break;
          case 'updated':
            const privilegeIndex = newPrivileges.findIndex(p => p.privilege_id === event.data.privilege_id);
            if (privilegeIndex !== -1) {
              newPrivileges[privilegeIndex] = event.data;
            }
            break;
          case 'deleted':
            return {
              ...prev,
              privileges: newPrivileges.filter(p => p.privilege_id !== event.data.privilege_id)
            };
        }
        
        return { ...prev, privileges: newPrivileges };
      });
    });

    // Handle notifications
    socketIo.on('notification', (notification: NotificationEvent) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    });

    socketIo.on('error', (error: any) => {
      console.error('Socket error:', error);
      setNotifications(prev => [{
        message: error.message || 'Connection error',
        type: 'error',
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  // Helper functions
  const refreshData = () => {
    if (socket) {
      socket.emit('get-initial-data');
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (timestamp: string) => {
    setNotifications(prev => prev.filter(n => n.timestamp !== timestamp));
  };

  return {
    socket,
    isConnected,
    data,
    notifications,
    refreshData,
    clearNotifications,
    removeNotification
  };
};
