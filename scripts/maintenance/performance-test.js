#!/usr/bin/env node

/**
 * Advanced database performance testing and optimization
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testPerformance() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac_system',
    charset: 'utf8mb4',
    timezone: '+00:00',
    multipleStatements: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    connectTimeout: 10000,
    timeout: 30000,
  };

  console.log('🚀 Database Performance Testing...\n');

  try {
    // Test 1: Connection Pool Performance
    console.log('📊 Test 1: Connection Pool Performance');
    const pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 20,
      queueLimit: 0,
    });

    const poolStart = Date.now();
    const poolPromises = [];
    for (let i = 0; i < 10; i++) {
      poolPromises.push(pool.execute('SELECT ? as test', [i]));
    }
    await Promise.all(poolPromises);
    const poolTime = Date.now() - poolStart;
    console.log(`   ✅ 10 concurrent queries: ${poolTime}ms\n`);

    // Test 2: Query Performance
    console.log('📊 Test 2: Common Query Performance');
    const connection = await pool.getConnection();
    
    // Test user queries
    const userQueryStart = Date.now();
    await connection.execute('SELECT COUNT(*) FROM db_users');
    const userQueryTime = Date.now() - userQueryStart;
    console.log(`   📋 User count query: ${userQueryTime}ms`);

    // Test role queries
    const roleQueryStart = Date.now();
    await connection.execute('SELECT COUNT(*) FROM roles');
    const roleQueryTime = Date.now() - roleQueryStart;
    console.log(`   👥 Role count query: ${roleQueryTime}ms`);

    // Test privilege queries
    const privQueryStart = Date.now();
    await connection.execute('SELECT COUNT(*) FROM privileges');
    const privQueryTime = Date.now() - privQueryStart;
    console.log(`   🔑 Privilege count query: ${privQueryTime}ms`);

    // Test complex join query
    const joinQueryStart = Date.now();
    await connection.execute(`
      SELECT u.username, r.name as role_name, p.name as privilege_name 
      FROM db_users u 
      LEFT JOIN user_roles ur ON u.db_user_id = ur.db_user_id 
      LEFT JOIN roles r ON ur.role_id = r.role_id 
      LEFT JOIN role_privileges rp ON r.role_id = rp.role_id 
      LEFT JOIN privileges p ON rp.privilege_id = p.privilege_id 
      LIMIT 100
    `);
    const joinQueryTime = Date.now() - joinQueryStart;
    console.log(`   🔗 Complex join query: ${joinQueryTime}ms\n`);

    // Test 3: Batch Operations
    console.log('📊 Test 3: Batch Operation Performance');
    const batchStart = Date.now();
    const batchQueries = [
      'SELECT COUNT(*) FROM db_users',
      'SELECT COUNT(*) FROM roles', 
      'SELECT COUNT(*) FROM privileges',
      'SELECT COUNT(*) FROM user_roles',
      'SELECT COUNT(*) FROM role_privileges'
    ];
    
    for (const query of batchQueries) {
      await connection.execute(query);
    }
    const batchTime = Date.now() - batchStart;
    console.log(`   📦 5 sequential queries: ${batchTime}ms`);

    const parallelStart = Date.now();
    const parallelPromises = batchQueries.map(query => connection.execute(query));
    await Promise.all(parallelPromises);
    const parallelTime = Date.now() - parallelStart;
    console.log(`   ⚡ 5 parallel queries: ${parallelTime}ms\n`);

    // Test 4: Index Analysis
    console.log('📊 Test 4: Index Analysis');
    try {
      const [indexes] = await connection.execute(`
        SELECT 
          TABLE_NAME,
          INDEX_NAME,
          COLUMN_NAME,
          CARDINALITY
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = ? 
        AND INDEX_NAME != 'PRIMARY'
        ORDER BY TABLE_NAME, INDEX_NAME
      `, [config.database]);
      
      console.log(`   📈 Found ${indexes.length} indexes on non-primary keys`);
      
      // Group by table
      const tableIndexes = {};
      indexes.forEach(idx => {
        if (!tableIndexes[idx.TABLE_NAME]) {
          tableIndexes[idx.TABLE_NAME] = [];
        }
        tableIndexes[idx.TABLE_NAME].push(idx);
      });

      Object.entries(tableIndexes).forEach(([tableName, idxs]) => {
        console.log(`   📋 ${tableName}: ${idxs.length} indexes`);
      });
    } catch (error) {
      console.log(`   ⚠️  Index analysis failed: ${error.message}`);
    }

    connection.release();
    await pool.end();

    console.log('\n🎉 Performance testing completed!');
    console.log('\n💡 Optimization Tips:');
    console.log('   • Use connection pooling for concurrent requests');
    console.log('   • Run parallel queries when possible');
    console.log('   • Monitor slow queries and add indexes as needed');
    console.log('   • Use prepared statements for repeated queries');
    console.log('   • Consider caching frequently accessed data');

  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
    process.exit(1);
  }
}

testPerformance();
