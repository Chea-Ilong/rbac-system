#!/usr/bin/env node

/**
 * Test database connection for troubleshooting
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac_system',
    // Performance optimizations
    charset: 'utf8mb4',
    timezone: '+00:00',
    multipleStatements: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    // Connection timeout settings
    connectTimeout: 10000, // 10 seconds
    timeout: 30000, // 30 seconds
  };

  console.log('🧪 Testing Database Connection...\n');
  console.log('📋 Configuration:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
  });

  const startTime = Date.now();

  try {
    // Test basic connection
    const connection = await mysql.createConnection(config);
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Database connection successful! (${connectionTime}ms)`);
    
    // Test query performance
    const queryStart = Date.now();
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?', [config.database]);
    const queryTime = Date.now() - queryStart;
    console.log(`📊 Found ${rows[0].count} tables in database (query: ${queryTime}ms)`);
    
    // Test connection pool simulation
    const poolTestStart = Date.now();
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(connection.execute('SELECT 1 as test'));
    }
    await Promise.all(promises);
    const poolTestTime = Date.now() - poolTestStart;
    console.log(`🔄 Concurrent query test completed (5 queries: ${poolTestTime}ms)`);
    
    await connection.end();
    const totalTime = Date.now() - startTime;
    console.log(`🔌 Connection closed successfully`);
    console.log(`⏱️  Total test time: ${totalTime}ms`);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
