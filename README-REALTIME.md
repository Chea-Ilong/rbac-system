# Real-time MariaDB RBAC System Setup Guide

## 🚀 Quick Start

Your RBAC system has been upgraded with real-time MariaDB database connectivity! Here's how to get everything running:

### 1. Database Setup

**Prerequisites:**
- MariaDB or MySQL server running
- Database credentials configured in `.env.local`

**Setup Steps:**

```bash
# 1. Ensure MariaDB is running
sudo systemctl start mariadb

# 2. Create the database
mysql -u root -p
CREATE DATABASE rbac_system;
USE rbac_system;
EXIT;

# 3. Run the SQL scripts to create tables
mysql -u root -p rbac_system < scripts/01-create-tables.sql
mysql -u root -p rbac_system < scripts/02-seed-data.sql

# 4. Verify database setup
npm run db:setup
```

### 2. Development Mode (Recommended)

**Start both Next.js and WebSocket servers:**
```bash
npm run dev:full
```

This will start:
- Next.js app on `http://localhost:3000`
- WebSocket server on `http://localhost:3001`

### 3. Manual Start (Alternative)

**Terminal 1 - Next.js App:**
```bash
npm run dev
```

**Terminal 2 - Real-time Server:**
```bash
npm run realtime
```

## 🎯 Features

### Real-time Updates
- **Live User Management**: See user changes instantly across all connected clients
- **Role & Privilege Sync**: Real-time role and privilege updates
- **System Notifications**: Live notifications for all CRUD operations
- **Connection Status**: Visual indicators for real-time connectivity

### Database Features
- **Connection Pooling**: Optimized MariaDB connections
- **Error Handling**: Comprehensive error management
- **Data Validation**: Input validation and sanitization
- **Foreign Key Constraints**: Proper relational data integrity

## 📁 File Structure

```
├── lib/
│   ├── db.ts                    # Real MariaDB database implementation
│   ├── database-config.ts       # Database connection configuration
│   ├── realtime-service.ts      # WebSocket server
│   └── db-mock.ts.backup        # Original mock database (backup)
├── hooks/
│   └── use-realtime.ts          # React hook for real-time updates
├── scripts/
│   ├── start-realtime.js        # Real-time server startup script
│   ├── verify-database.js       # Database verification utility
│   ├── 01-create-tables.sql     # Database schema
│   └── 02-seed-data.sql         # Initial data
└── .env.local                   # Environment configuration
```

## 🔧 Configuration

### Environment Variables (`.env.local`)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=rbac_system

# Real-time Configuration
WEBSOCKET_PORT=3001
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
```

### Key Components

**1. Database Connection (`lib/database-config.ts`)**
- Connection pooling for better performance
- Automatic reconnection handling
- Health check functionality

**2. Real-time Service (`lib/realtime-service.ts`)**
- WebSocket server with Socket.IO
- Room-based broadcasts
- Event-driven architecture
- Graceful shutdown handling

**3. React Hook (`hooks/use-realtime.ts`)**
- Automatic connection management
- Real-time data synchronization
- Notification system
- Connection status monitoring

## 🛠️ Usage in Components

### Basic Real-time Hook Usage
```typescript
import { useRealTime } from '@/hooks/use-realtime';

function UserManagement() {
  const { data, isConnected, notifications } = useRealTime();
  
  return (
    <div>
      <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      <div>Users: {data.users.length}</div>
      <div>Roles: {data.roles.length}</div>
      <div>Privileges: {data.privileges.length}</div>
    </div>
  );
}
```

### Real-time Notifications
```typescript
const { notifications, removeNotification } = useRealTime();

return (
  <div>
    {notifications.map((notification) => (
      <div key={notification.timestamp}>
        <span>{notification.message}</span>
        <button onClick={() => removeNotification(notification.timestamp)}>
          ×
        </button>
      </div>
    ))}
  </div>
);
```

## 🚨 API Endpoints

All API endpoints now support real-time updates:

**Users:**
- `GET /api/users` - List all users
- `POST /api/users` - Create user (broadcasts to all clients)
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user (broadcasts to all clients)
- `DELETE /api/users/[id]` - Delete user (broadcasts to all clients)

**Real-time Events:**
- `user-update` - User created/updated/deleted
- `role-update` - Role created/updated/deleted
- `privilege-update` - Privilege created/updated/deleted
- `notification` - System notifications

## 🔍 Monitoring & Debugging

### Database Health Check
```bash
npm run db:setup
```

### Real-time Server Status
The real-time server provides connection status and metrics:
- Connected clients count
- Active rooms
- Event broadcasting logs

### Logs to Watch
- Database connection status
- WebSocket connection events
- Real-time update broadcasts
- Error messages and stack traces

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check MariaDB status
sudo systemctl status mariadb

# Verify credentials
mysql -u root -p

# Check .env.local configuration
```

**2. WebSocket Connection Issues**
```bash
# Check if port 3001 is available
netstat -tlnp | grep 3001

# Verify NEXT_PUBLIC_WEBSOCKET_URL in .env.local
```

**3. Real-time Updates Not Working**
- Ensure both servers are running (`npm run dev:full`)
- Check browser console for WebSocket errors
- Verify API calls are using the updated endpoints

### Performance Optimization

**Database:**
- Connection pooling is already configured
- Indexes are set up for optimal queries
- Foreign key constraints ensure data integrity

**WebSocket:**
- Room-based broadcasting reduces unnecessary traffic
- Automatic reconnection handles network issues
- Graceful shutdown prevents data loss

## 🎉 What's New

### Replaced Mock Database
- ✅ Real MariaDB connection with connection pooling
- ✅ Proper error handling and validation
- ✅ Foreign key constraints and data integrity
- ✅ Optimized queries and performance

### Added Real-time Features
- ✅ WebSocket server with Socket.IO
- ✅ Live updates across all connected clients
- ✅ System notifications and events
- ✅ Connection status monitoring

### Enhanced API
- ✅ Real-time broadcasting on all CRUD operations
- ✅ Improved error handling and responses
- ✅ Database health checking
- ✅ Proper TypeScript types

## 📈 Next Steps

1. **Start Development**: `npm run dev:full`
2. **Test Real-time**: Open multiple browser tabs to see live updates
3. **Monitor Performance**: Watch database and WebSocket logs
4. **Customize**: Modify real-time events based on your needs

Your RBAC system is now powered by MariaDB with real-time capabilities! 🎊
