import { Server } from 'socket.io';
import { createServer } from 'http';
import { db } from './db';

class RealTimeService {
  private io: Server | null = null;
  private server: any = null;

  initialize(port: number = 3001) {
    this.server = createServer();
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    
    this.server.listen(port, () => {
      console.log(`🚀 Real-time server running on port ${port}`);
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log('👤 Client connected:', socket.id);

      // Join specific rooms for targeted updates
      socket.on('join-room', (room: string) => {
        socket.join(room);
        console.log(`👤 Client ${socket.id} joined room: ${room}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('👤 Client disconnected:', socket.id);
      });

      // Send initial data
      socket.on('get-initial-data', async () => {
        try {
          const [dbUsers, roles, privileges] = await Promise.all([
            db.getDatabaseUsers(),
            db.getRoles(),
            db.getPrivileges()
          ]);

          socket.emit('initial-data', {
            database_users: dbUsers,
            roles,
            privileges
          });
        } catch (error) {
          socket.emit('error', { message: 'Failed to fetch initial data' });
        }
      });
    });
  }

  // Broadcast methods for real-time updates
  broadcastDatabaseUserUpdate(eventType: 'created' | 'updated' | 'deleted', user: any) {
    if (!this.io) return;
    
    this.io.to('database-users').emit('database-user-update', {
      type: eventType,
      data: user,
      timestamp: new Date().toISOString()
    });
  }

  broadcastRoleUpdate(eventType: 'created' | 'updated' | 'deleted', role: any) {
    if (!this.io) return;
    
    this.io.to('roles').emit('role-update', {
      type: eventType,
      data: role,
      timestamp: new Date().toISOString()
    });
  }

  broadcastPrivilegeUpdate(eventType: 'created' | 'updated' | 'deleted', privilege: any) {
    if (!this.io) return;
    
    this.io.to('privileges').emit('privilege-update', {
      type: eventType,
      data: privilege,
      timestamp: new Date().toISOString()
    });
  }

  broadcastDatabaseUserRoleUpdate(eventType: 'assigned' | 'removed', data: { dbUserId: number; roleId: number }) {
    if (!this.io) return;
    
    this.io.to('database-user-roles').emit('database-user-role-update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  broadcastRolePrivilegeUpdate(eventType: 'assigned' | 'removed', data: { roleId: number; privilegeId: number }) {
    if (!this.io) return;
    
    this.io.to('role-privileges').emit('role-privilege-update', {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast system notifications
  broadcastNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    if (!this.io) return;
    
    this.io.emit('notification', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection status
  getStatus() {
    return {
      isRunning: this.io !== null,
      connectedClients: this.io ? this.io.engine.clientsCount : 0
    };
  }

  // Graceful shutdown
  shutdown() {
    if (this.io) {
      this.io.close();
      console.log('🔒 Real-time server shut down');
    }
  }
}

export const realTimeService = new RealTimeService();
export default realTimeService;
