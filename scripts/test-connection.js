#!/usr/bin/env node

/**
 * Simple database test using mysql2 directly
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac_system',
  };

  console.log('🧪 Testing MariaDB Connection...\n');
  console.log('📋 Configuration:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
  });

  try {
    // Test connection
    console.log('\n1. Testing connection...');
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to MariaDB!');

    // Test data retrieval
    console.log('\n2. Testing data retrieval...');
    
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM Users');
    const [roles] = await connection.execute('SELECT COUNT(*) as count FROM Roles');
    const [privileges] = await connection.execute('SELECT COUNT(*) as count FROM Privileges');
    
    console.log(`✅ Found ${users[0].count} users`);
    console.log(`✅ Found ${roles[0].count} roles`);
    console.log(`✅ Found ${privileges[0].count} privileges`);

    // Test sample data
    console.log('\n3. Testing sample data...');
    const [sampleUsers] = await connection.execute('SELECT name, email FROM Users LIMIT 3');
    sampleUsers.forEach(user => {
      console.log(`✅ User: ${user.name} (${user.email})`);
    });

    await connection.end();
    
    console.log('\n🎉 All database tests passed!');
    console.log('🚀 Your MariaDB connection is working perfectly!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Run: npm run realtime (in another terminal)');
    console.log('   3. Open: http://localhost:3000');
    console.log('   4. Login with: admin@platform.com / admin123');

  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   - Make sure MariaDB/MySQL is running');
    console.error('   - Check your .env.local file');
    console.error('   - Verify database credentials');
    console.error('   - Ensure rbac_system database exists');
    process.exit(1);
  }
}

testDatabaseConnection();
