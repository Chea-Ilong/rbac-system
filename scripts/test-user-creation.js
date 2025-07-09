#!/usr/bin/env node

/**
 * Test database user creation with fixed code
 */

require('dotenv').config({ path: '.env.local' });

async function testUserCreation() {
  try {
    // Import the server database module
    const { serverDb } = require('../lib/db-server');
    
    console.log('🧪 Testing Database User Creation...\n');
    
    // Initialize database
    await serverDb.init();
    console.log('✅ Database initialized');
    
    // Test creating a database user
    const testUser = {
      username: `test_user_${Date.now()}`,
      host: '%',
      description: 'Test user created via API test',
      password: 'testpass123'
    };
    
    console.log(`🔄 Creating database user: ${testUser.username}@${testUser.host}`);
    
    try {
      const createdUser = await serverDb.createDatabaseUser(testUser);
      console.log('✅ Database user created successfully:', {
        id: createdUser.db_user_id,
        username: createdUser.username,
        host: createdUser.host,
        description: createdUser.description
      });
      
      // Test querying the created user
      const queriedUser = await serverDb.getDatabaseUserById(createdUser.db_user_id);
      console.log('✅ User query successful:', queriedUser ? 'Found' : 'Not found');
      
      // Clean up - delete the test user
      console.log(`🔄 Cleaning up test user...`);
      const deleted = await serverDb.deleteDatabaseUser(createdUser.db_user_id);
      console.log('✅ Test user cleanup:', deleted ? 'Success' : 'Failed');
      
    } catch (createError) {
      console.error('❌ Failed to create database user:', createError.message);
      console.error('Full error:', createError);
    }
    
    console.log('\n🎉 Database user creation test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
  
  // Exit the process
  process.exit(0);
}

testUserCreation();
