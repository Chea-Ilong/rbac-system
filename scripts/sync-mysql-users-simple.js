#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'rbac_system', // Force use rbac_system database for RBAC operations
  multipleStatements: true
};

async function syncUsers() {
  console.log('🔧 Syncing database users with MySQL...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');
    
    // Get all database users from our tracking table
    const [databaseUsers] = await connection.execute(
      'SELECT db_user_id, username, host, description FROM DatabaseUsers'
    );
    
    console.log(`📋 Found ${databaseUsers.length} database users in tracking table`);
    
    // Get existing MySQL users
    const [mysqlUsers] = await connection.execute(
      "SELECT User, Host FROM mysql.user"
    );
    const existingUsers = new Set(
      mysqlUsers.map(user => `${user.User}@${user.Host}`)
    );
    
    console.log(`📋 Found ${mysqlUsers.length} existing MySQL users`);

    let created = 0;
    let skipped = 0;
    const defaultPassword = 'temp123';

    for (const dbUser of databaseUsers) {
      const userKey = `${dbUser.username}@${dbUser.host}`;
      
      if (!existingUsers.has(userKey)) {
        try {
          // Create MySQL user with default password
          const createUserQuery = `CREATE USER '${dbUser.username}'@'${dbUser.host}' IDENTIFIED BY '${defaultPassword}'`;
          await connection.execute(createUserQuery);
          
          console.log(`✅ Created MySQL user: ${dbUser.username}@${dbUser.host}`);
          created++;
        } catch (error) {
          console.error(`❌ Failed to create MySQL user ${dbUser.username}@${dbUser.host}:`, error.message);
        }
      } else {
        console.log(`ℹ️ MySQL user already exists: ${dbUser.username}@${dbUser.host}`);
        skipped++;
      }
    }

    // Flush privileges to ensure changes take effect
    await connection.execute('FLUSH PRIVILEGES');
    
    console.log(`\n🎉 Sync complete: ${created} users created, ${skipped} users skipped`);
    
    // Now show all users that should have privileges applied
    console.log('\n🔍 Checking users with roles that need privileges applied...');
    const [usersWithRoles] = await connection.execute(`
      SELECT DISTINCT du.username, du.host, du.db_user_id
      FROM DatabaseUsers du
      INNER JOIN DatabaseUserRoles dur ON du.db_user_id = dur.db_user_id
      ORDER BY du.username, du.host
    `);
    
    console.log('📋 Users with roles assigned (need privilege application):');
    for (const user of usersWithRoles) {
      console.log(`   - ${user.username}@${user.host} (ID: ${user.db_user_id})`);
    }
    
    if (usersWithRoles.length > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Use the "Apply Privileges" button in the UI for each user');
      console.log('   2. Or call the API endpoint: POST /api/users/{id}/apply-privileges');
      console.log('   3. Or run a script to apply privileges to all users');
    }
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

syncUsers();
