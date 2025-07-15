# RBAC System - Clean Version

A Role-Based Access Control (RBAC) system built with Next.js, TypeScript, and MySQL.

## Project Structure

### `/components`
Core React components for the application:
- `admin-dashboard.tsx` - Main dashboard with tabs for user/role/privilege management
- `login-form.tsx` - Authentication form
- `user-management.tsx` - Manages database users and their role assignments
- `role-management.tsx` - Create and manage roles
- `privilege-management.tsx` - Create and manage privileges
- `granular-privilege-manager.tsx` - Fine-grained privilege assignment for users

### `/components/ui`
Reusable UI components (only the ones actually used):
- `alert.tsx` - Alert notifications
- `badge.tsx` - Badge/tag components
- `button.tsx` - Button component
- `card.tsx` - Card layout components
- `checkbox.tsx` - Checkbox input
- `dialog.tsx` - Modal dialogs
- `input.tsx` - Text input components
- `label.tsx` - Form labels
- `select.tsx` - Dropdown select components
- `table.tsx` - Table components
- `tabs.tsx` - Tab navigation
- `textarea.tsx` - Multi-line text input
- `toast.tsx` & `toaster.tsx` - Toast notifications

### `/lib`
Core library files:
- `auth.ts` - Authentication and authorization logic
- `database-config.ts` - Database connection configuration
- `db-server.ts` - Server-side database operations
- `db.ts` - Client-side database operations
- `utils.ts` - Utility functions (className merging, etc.)
- `fast-db.ts` - Caching layer for performance optimization

### `/hooks`
Custom React hooks:
- `use-toast.ts` - Toast notification hook
- `use-performance.ts` - Performance monitoring and optimization

### `/scripts`
Organized into subdirectories:

#### `/scripts/sql`
Clean, production-ready database schema (run in order):
- `01-create-tables.sql` - Core RBAC tables with proper indexing
- `02-seed-data.sql` - Essential seed data and sample users
- `05-performance-indexes.sql` - Performance optimization indexes

#### `/scripts/maintenance`
Essential maintenance and troubleshooting scripts:
- `test-connection.js` - Test database connectivity (with performance metrics)
- `verify-setup.js` - Verify database schema and setup
- `performance-test.js` - Advanced performance testing
- `fix-params.js` - Next.js 15 parameter compatibility fix

#### `/scripts/`
Database setup:
- `setup-database.sh` - Complete database setup script

### `/app/api`
REST API endpoints organized by resource:

#### `/app/api/auth`
Authentication endpoints:
- `login/route.ts` - User login
- `logout/route.ts` - User logout  
- `me/route.ts` - Get current user info

#### `/app/api/users`
User management endpoints:
- `route.ts` - GET (list), POST (create)
- `[id]/route.ts` - GET (details), PUT (update), DELETE (remove)
- `[id]/roles/route.ts` - GET (user roles), POST (assign), DELETE (revoke)
- `[id]/privileges/route.ts` - GET (user privileges), POST (assign)
- `[id]/privileges/[privilegeId]/route.ts` - DELETE (revoke privilege)
- `[id]/apply-privileges/route.ts` - POST (apply privileges to database)
- `[id]/scoped-roles/route.ts` - GET (scoped roles), POST (assign scoped role)
- `[id]/scoped-roles/[roleId]/route.ts` - DELETE (revoke scoped role)

#### `/app/api/roles`
Role management endpoints:
- `route.ts` - GET (list), POST (create)
- `[id]/route.ts` - GET (details), PUT (update), DELETE (remove)
- `[id]/privileges/route.ts` - GET (role privileges), POST (assign), DELETE (revoke all)
- `[id]/privileges/[privilegeId]/route.ts` - DELETE (revoke specific privilege)

#### `/app/api/privileges`
Privilege management endpoints:
- `route.ts` - GET (list), POST (create)
- `[id]/route.ts` - GET (details), PUT (update), DELETE (remove)
- `[id]/roles/route.ts` - GET (privilege roles), POST (assign to roles)

#### `/app/api/databases`
Database object endpoints (using serverDb):
- `route.ts` - GET (list databases)
- `[database]/tables/route.ts` - GET (tables for database)

#### `/app/api/discover`
Database discovery endpoints (direct MariaDB queries):
- `databases/route.ts` - GET (discover all databases)
- `databases/[database]/tables/route.ts` - GET (discover tables in database)

#### `/app/api/stats`
System statistics:
- `route.ts` - GET (system stats for dashboard)

#### `/app/api/health`
Health check:
- `route.ts` - GET (system health status)

## Features

- **User Management**: Create, edit, and manage database users
- **Role Management**: Define roles with specific privileges  
- **Privilege Management**: Fine-grained privilege control
- **Scoped Assignments**: Assign roles/privileges at global, database, or table level
- **Real-time Updates**: Live privilege assignment and management
- **Authentication**: Secure login system

## Usage

1. Start the development server: `npm run dev`
2. Access the application at `http://localhost:3000`
3. Login with admin credentials
4. Use the dashboard tabs to manage users, roles, and privileges

## Database Setup

Run the SQL scripts in order:
1. `scripts/sql/01-create-tables.sql`
2. `scripts/sql/02-seed-data.sql` 
3. `scripts/sql/03-enhance-granular-permissions.sql`
4. `scripts/sql/04-scoped-role-assignments.sql`

## Testing

Use the maintenance scripts to verify functionality:
- `node scripts/maintenance/test-connection.js` - Test database connection
- `node scripts/maintenance/verify-setup.js` - Verify complete database setup
- `node scripts/maintenance/performance-test.js` - Run performance tests

## Maintenance

The application includes built-in management features through the web interface. For troubleshooting:
- Use `test-connection.js` if you're having database connectivity issues
- Use `verify-setup.js` to ensure all required tables exist

## Performance Optimizations

### Database Connection Pool
- Optimized connection pool with 20 concurrent connections
- Enhanced connection settings for better performance
- Automatic connection management and reuse

### Caching Layer (`/lib/fast-db.ts`)
- In-memory caching with 5-minute TTL
- Batch query execution for multiple operations
- Optimized dashboard statistics with single query
- Cache invalidation strategies

### Performance Monitoring (`/hooks/use-performance.ts`)
- Request timing and monitoring
- Slow query detection (>1000ms)
- Enhanced fetch with automatic performance tracking
- Client-side caching with configurable TTL

### Database Indexes (`/scripts/sql/05-performance-indexes.sql`)
- Comprehensive indexing strategy for all tables
- Composite indexes for complex queries
- Covering indexes for frequently accessed data
- Index analysis and optimization

### Performance Testing
- `scripts/maintenance/performance-test.js` - Advanced performance testing
- Connection pool benchmarking
- Query performance analysis
- Index usage monitoring

## Documentation

### `/docs`
Documentation files:
- `PERFORMANCE_GUIDE.md` - Comprehensive performance optimization guide
- `database-setup.md` - Database setup instructions
