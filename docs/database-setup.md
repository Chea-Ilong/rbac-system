# Database Setup Guide

## Prerequisites
- MySQL or MariaDB server installed
- Database client (MySQL Workbench, phpMyAdmin, or command line)

## Step 1: Create Database
\`\`\`sql
CREATE DATABASE rbac_system;
USE rbac_system;
\`\`\`

## Step 2: Run the SQL Scripts
Execute the scripts in order:
1. `scripts/01-create-tables.sql` - Creates all tables
2. `scripts/02-seed-data.sql` - Inserts initial data

## Step 3: Configure Environment Variables
Create a `.env.local` file in your project root:

\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=rbac_system
\`\`\`

## Step 4: Install Database Driver
For production use, install a MySQL driver:

\`\`\`bash
npm install mysql2
# or
npm install @planetscale/database
\`\`\`

## Step 5: Update Database Connection
Replace the mock database in `lib/db.ts` with actual MySQL connection:

\`\`\`typescript
import mysql from 'mysql2/promise'
import { dbConfig } from './database-config'

const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

export const db = {
  query: async (sql: string, params: any[] = []) => {
    const [rows] = await pool.execute(sql, params)
    return rows
  },
  // ... implement other methods
}
\`\`\`

## API Endpoints
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/[id]` - Get user by ID
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

## Testing the Connection
1. Start your database server
2. Run the SQL scripts
3. Update the environment variables
4. Test the login with: admin@platform.com / admin123
