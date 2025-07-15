#!/usr/bin/env node

/**
 * Verify database setup and schema
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function verifyDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rbac_system',
  };

  console.log('🔍 Verifying Database Setup...\n');

  try {
    const connection = await mysql.createConnection(config);
    
    // Check required tables exist
    const requiredTables = ['DatabaseUsers', 'Roles', 'Privileges', 'RolePrivileges', 'DatabaseUserRoles'];
    const [tables] = await connection.execute(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?', 
      [config.database]
    );
    
    const existingTables = tables.map(row => row.table_name || row.TABLE_NAME);
    console.log('📋 Existing tables:', existingTables.join(', '));
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('❌ Missing required tables:', missingTables.join(', '));
      console.log('💡 Run the SQL setup scripts first!');
    } else {
      console.log('✅ All required tables exist');
      
      // Check data
      for (const table of requiredTables) {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📊 ${table}: ${rows[0].count || rows[0].COUNT} records`);
      }
    }
    
    await connection.end();
    console.log('\n✅ Database verification complete');
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
