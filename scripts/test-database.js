#!/usr/bin/env node

/**
 * Test the new database connection
 */

require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    // Import the database configuration
    const { testConnection } = require('../lib/database-config');
    const { serverDb } = require('../lib/db-server');
    
    console.log('🧪 Testing Real-time Database Connection...\n');
    
    // Test basic connection
    console.log('1. Testing basic connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.log('❌ Connection failed!');
      process.exit(1);
    }
    
    // Test database initialization
    console.log('2. Testing database initialization...');
    await serverDb.init();
    console.log('✅ Database initialized successfully');
    
    // Test data retrieval
    console.log('3. Testing data retrieval...');
    const dbUsers = await serverDb.getDatabaseUsers();
    const roles = await serverDb.getRoles();
    const privileges = await serverDb.getPrivileges();
    
    console.log(`✅ Found ${dbUsers.length} database users`);
    console.log(`✅ Found ${roles.length} roles`);
    console.log(`✅ Found ${privileges.length} privileges`);
    
    // Test database user operations
    console.log('4. Testing database user operations...');
    if (dbUsers.length > 0) {
      const firstUser = dbUsers[0];
      console.log(`✅ Sample database user: ${firstUser.username}@${firstUser.host}`);
      
      // Test user roles
      const userRoles = await serverDb.getDatabaseUserRoles(firstUser.db_user_id);
      console.log(`✅ Database user has ${userRoles.length} roles`);
    }
    
    // Test health check
    console.log('5. Testing health check...');
    const health = await serverDb.healthCheck();
    console.log(`✅ Health status: ${health.status}`);
    
    console.log('\n🎉 All database tests passed!');
    console.log('🚀 Your MariaDB real-time connection is ready!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testConnection();
