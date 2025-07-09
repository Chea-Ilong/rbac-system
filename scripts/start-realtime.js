#!/usr/bin/env node

/**
 * Real-time WebSocket Server
 * Run this alongside your Next.js application for real-time features
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: '.env.local' });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rbac_system',
};

// Create connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection function
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

class RealTimeService {
  constructor() {
    this.io = null;
    this.server = null;
  }

  initialize(port = 3001) {
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

  setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log('👤 Client connected:', socket.id);

      // Join specific rooms for targeted updates
      socket.on('join-room', (room) => {
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
          const [usersResult] = await pool.execute('SELECT * FROM Users ORDER BY created_at DESC');
          const [rolesResult] = await pool.execute('SELECT * FROM Roles ORDER BY created_at DESC');
          const [privilegesResult] = await pool.execute('SELECT * FROM Privileges ORDER BY created_at DESC');

          socket.emit('initial-data', {
            users: usersResult,
            roles: rolesResult,
            privileges: privilegesResult
          });
        } catch (error) {
          console.error('Error fetching initial data:', error);
          socket.emit('error', { message: 'Failed to fetch initial data' });
        }
      });
    });
  }

  // Broadcast methods for real-time updates
  broadcastUserUpdate(eventType, user) {
    if (!this.io) return;
    
    this.io.to('users').emit('user-update', {
      type: eventType,
      data: user,
      timestamp: new Date().toISOString()
    });
  }

  broadcastRoleUpdate(eventType, role) {
    if (!this.io) return;
    
    this.io.to('roles').emit('role-update', {
      type: eventType,
      data: role,
      timestamp: new Date().toISOString()
    });
  }

  broadcastNotification(message, type = 'info') {
    if (!this.io) return;
    
    this.io.emit('notification', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }

  getStatus() {
    return {
      isRunning: this.io !== null,
      connectedClients: this.io ? this.io.engine.clientsCount : 0
    };
  }

  shutdown() {
    if (this.io) {
      this.io.close();
      console.log('🔒 Real-time server shut down');
    }
  }
}

const realTimeService = new RealTimeService();

async function startRealTimeServer() {
  try {
    console.log('🚀 Starting Real-time Server...');
    
    // Test database connection first
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed. Please check your configuration.');
      process.exit(1);
    }
    
    // Start the real-time server
    const port = parseInt(process.env.WEBSOCKET_PORT || '3001');
    realTimeService.initialize(port);
    
    console.log('✅ Real-time server is ready!');
    console.log(`📡 WebSocket server: http://localhost:${port}`);
    console.log('📊 Real-time features enabled');
    
  } catch (error) {
    console.error('❌ Failed to start real-time server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔒 Shutting down real-time server...');
  realTimeService.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔒 Shutting down real-time server...');
  realTimeService.shutdown();
  process.exit(0);
});

// Export for use in API routes
module.exports = { realTimeService, pool };

// Start the server if this file is run directly
if (require.main === module) {
  startRealTimeServer();
}
