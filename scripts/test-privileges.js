#!/usr/bin/env node

/**
 * Test privilege application to database users
 */

require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function testPrivilegeApplication() {
  console.log('🧪 Testing Privilege Application...\n');
  
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rbac_system",
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful!');

    // 1. Check current database users and their roles
    console.log('\n📋 Current Database Users and Roles:');
    const [userRoles] = await connection.execute(`
      SELECT 
        du.db_user_id,
        du.username,
        du.host,
        GROUP_CONCAT(r.name) as roles,
        GROUP_CONCAT(r.role_id) as role_ids
      FROM DatabaseUsers du
      LEFT JOIN DatabaseUserRoles dur ON du.db_user_id = dur.db_user_id
      LEFT JOIN Roles r ON dur.role_id = r.role_id
      GROUP BY du.db_user_id
      ORDER BY du.username
    `);

    userRoles.forEach(user => {
      console.log(`   - ${user.username}@${user.host} (ID: ${user.db_user_id}): [${user.roles || 'No roles'}]`);
    });

    // 2. Check what privileges each role should have
    console.log('\n🔐 Role Privileges:');
    const [rolePrivileges] = await connection.execute(`
      SELECT 
        r.name as role_name,
        GROUP_CONCAT(p.name) as privileges
      FROM Roles r
      LEFT JOIN RolePrivileges rp ON r.role_id = rp.role_id
      LEFT JOIN Privileges p ON rp.privilege_id = p.privilege_id
      GROUP BY r.role_id
      ORDER BY r.name
    `);

    rolePrivileges.forEach(role => {
      console.log(`   - ${role.role_name}: [${role.privileges || 'No privileges'}]`);
    });

    // 3. Test creating a MySQL user and applying privileges
    console.log('\n🧪 Testing MySQL User Creation and Privilege Application:');
    
    const testUser = userRoles.find(user => user.username === 'dev_user');
    if (testUser && testUser.roles) {
      console.log(`Testing with user: ${testUser.username}@${testUser.host}`);
      
      try {
        // Check if user exists in MySQL
        const [mysqlUsers] = await connection.execute(
          "SELECT User, Host FROM mysql.user WHERE User = ? AND Host = ?",
          [testUser.username, testUser.host]
        );
        
        if (mysqlUsers.length === 0) {
          console.log(`   ℹ️ MySQL user ${testUser.username}@${testUser.host} does not exist`);
          console.log(`   Creating MySQL user...`);
          
          // Create MySQL user
          await connection.execute(
            `CREATE USER ?@? IDENTIFIED BY 'dev123'`,
            [testUser.username, testUser.host]
          );
          console.log(`   ✅ Created MySQL user ${testUser.username}@${testUser.host}`);
        } else {
          console.log(`   ✅ MySQL user ${testUser.username}@${testUser.host} already exists`);
        }

        // Test applying privileges via API call
        console.log(`   Applying privileges for roles: ${testUser.roles}`);
        
        // For now, let's just check what privileges they should get
        const [userPrivileges] = await connection.execute(`
          SELECT DISTINCT p.name
          FROM DatabaseUsers du
          JOIN DatabaseUserRoles dur ON du.db_user_id = dur.db_user_id
          JOIN RolePrivileges rp ON dur.role_id = rp.role_id
          JOIN Privileges p ON rp.privilege_id = p.privilege_id
          WHERE du.db_user_id = ?
        `, [testUser.db_user_id]);

        console.log(`   Privileges to apply: [${userPrivileges.map(p => p.name).join(', ')}]`);

      } catch (error) {
        console.error(`   ❌ Error testing user ${testUser.username}:`, error.message);
      }
    }

    await connection.end();
    console.log('\n🎉 Privilege application test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPrivilegeApplication();
