#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { serverDb } = require('../lib/db-server');

async function syncUsers() {
  console.log('🔧 Syncing database users with MySQL...');
  
  try {
    await serverDb.init();
    console.log('✅ Database connection initialized');
    
    // Sync existing database users with MySQL
    await serverDb.syncDatabaseUsersWithMySQL('temp123');
    
    console.log('\n🔍 Checking MySQL users after sync...');
    const { pool } = require('../lib/database-config');
    const [users] = await pool.execute(
      "SELECT User, Host FROM mysql.user WHERE User IN ('admin_user', 'dev_user', 'readonly_user', 'app_user', 'long', 'heang1') ORDER BY User, Host"
    );
    
    console.log('📋 MySQL users:');
    users.forEach(user => {
      console.log(`   - ${user.User}@${user.Host}`);
    });
    
    console.log('\n🎉 Sync operation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  }
}

syncUsers();
