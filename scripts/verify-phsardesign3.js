#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'rbac_system', // Force use rbac_system database for RBAC tables
  multipleStatements: true
};

async function verifyPhsarDesign3Setup() {
  console.log('🔍 Verifying PhsarDesign3 RBAC Setup...\n');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to RBAC database');
    
    // 1. Check if PhsarDesign3 database exists
    console.log('\n📋 1. Checking PhsarDesign3 database...');
    const [databases] = await connection.execute("SHOW DATABASES LIKE 'PhsarDesign3'");
    if (databases.length > 0) {
      console.log('✅ PhsarDesign3 database exists');
    } else {
      console.log('❌ PhsarDesign3 database not found');
    }
    
    // 2. Check database users in our tracking table
    console.log('\n📋 2. Database Users in tracking table...');
    const [dbUsers] = await connection.execute(`
      SELECT db_user_id, username, host, description 
      FROM DatabaseUsers 
      ORDER BY db_user_id
    `);
    
    console.log(`Found ${dbUsers.length} database users:`);
    dbUsers.forEach(user => {
      console.log(`   ${user.db_user_id}. ${user.username}@${user.host} - ${user.description}`);
    });
    
    // 3. Check PhsarDesign3 specific users
    console.log('\n📋 3. PhsarDesign3 application users...');
    const [phsarUsers] = await connection.execute(`
      SELECT db_user_id, username, host, description 
      FROM DatabaseUsers 
      WHERE description LIKE '%PhsarDesign3%'
      ORDER BY db_user_id
    `);
    
    if (phsarUsers.length > 0) {
      console.log(`Found ${phsarUsers.length} PhsarDesign3 users:`);
      phsarUsers.forEach(user => {
        console.log(`   ✅ ${user.username}@${user.host} - ${user.description}`);
      });
    } else {
      console.log('❌ No PhsarDesign3 users found in tracking table');
    }
    
    // 4. Check MySQL users existence
    console.log('\n📋 4. Checking if MySQL users exist...');
    const phsarUsernames = phsarUsers.map(u => u.username);
    
    if (phsarUsernames.length > 0) {
      const placeholders = phsarUsernames.map(() => '?').join(',');
      const [mysqlUsers] = await connection.execute(
        `SELECT User, Host FROM mysql.user WHERE User IN (${placeholders})`,
        phsarUsernames
      );
      
      console.log('MySQL users found:');
      mysqlUsers.forEach(user => {
        console.log(`   ✅ ${user.User}@${user.Host}`);
      });
      
      // Check which PhsarDesign3 users are missing in MySQL
      const mysqlUserKeys = new Set(mysqlUsers.map(u => `${u.User}@${u.Host}`));
      const missingUsers = phsarUsers.filter(u => !mysqlUserKeys.has(`${u.username}@${u.host}`));
      
      if (missingUsers.length > 0) {
        console.log('\n❌ Missing MySQL users:');
        missingUsers.forEach(user => {
          console.log(`   - ${user.username}@${user.host}`);
        });
      } else {
        console.log('\n✅ All PhsarDesign3 users exist in MySQL');
      }
    }
    
    // 5. Check roles assigned to PhsarDesign3 users
    console.log('\n📋 5. Roles assigned to PhsarDesign3 users...');
    const [userRoles] = await connection.execute(`
      SELECT du.username, du.host, r.name as role_name, r.description, r.is_database_role
      FROM DatabaseUsers du
      INNER JOIN DatabaseUserRoles dur ON du.db_user_id = dur.db_user_id
      INNER JOIN Roles r ON dur.role_id = r.role_id
      WHERE du.description LIKE '%PhsarDesign3%'
      ORDER BY du.username, r.name
    `);
    
    if (userRoles.length > 0) {
      console.log('Role assignments:');
      userRoles.forEach(ur => {
        const roleType = ur.is_database_role ? '(DB Role)' : '(App Role)';
        console.log(`   ✅ ${ur.username}@${ur.host} → ${ur.role_name} ${roleType}`);
      });
    } else {
      console.log('❌ No roles assigned to PhsarDesign3 users');
    }
    
    // 6. Check privileges for each PhsarDesign3 user
    console.log('\n📋 6. Privileges for PhsarDesign3 users...');
    for (const user of phsarUsers) {
      console.log(`\n   User: ${user.username}@${user.host}`);
      
      const [privileges] = await connection.execute(`
        SELECT DISTINCT p.name, p.description, p.privilege_type
        FROM DatabaseUsers du
        INNER JOIN DatabaseUserRoles dur ON du.db_user_id = dur.db_user_id
        INNER JOIN RolePrivileges rp ON dur.role_id = rp.role_id
        INNER JOIN Privileges p ON rp.privilege_id = p.privilege_id
        WHERE du.db_user_id = ?
        ORDER BY p.name
      `, [user.db_user_id]);
      
      if (privileges.length > 0) {
        console.log(`     Has ${privileges.length} privileges:`);
        privileges.forEach(priv => {
          console.log(`       - ${priv.name} (${priv.privilege_type})`);
        });
      } else {
        console.log('     ❌ No privileges assigned');
      }
    }
    
    // 7. Test MySQL connection for PhsarDesign3 users
    console.log('\n📋 7. Testing MySQL connections for PhsarDesign3 users...');
    const defaultPassword = 'temp123';
    
    for (const user of phsarUsers) {
      const mysqlUserExists = await connection.execute(
        "SELECT 1 FROM mysql.user WHERE User = ? AND Host = ?",
        [user.username, user.host]
      );
      
      if (mysqlUserExists[0].length > 0) {
        try {
          // Test connection
          const testConnection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '3306'),
            user: user.username,
            password: defaultPassword,
            database: 'PhsarDesign3'
          });
          
          // Test basic operations
          await testConnection.execute('SELECT 1');
          await testConnection.end();
          
          console.log(`   ✅ ${user.username}@${user.host} - Connection successful`);
        } catch (error) {
          console.log(`   ❌ ${user.username}@${user.host} - Connection failed: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ ${user.username}@${user.host} - MySQL user doesn't exist`);
      }
    }
    
    // 8. Show MySQL grants for PhsarDesign3 users
    console.log('\n📋 8. MySQL grants for PhsarDesign3 users...');
    for (const user of phsarUsers) {
      try {
        const [grants] = await connection.execute(`SHOW GRANTS FOR '${user.username}'@'${user.host}'`);
        console.log(`\n   Grants for ${user.username}@${user.host}:`);
        grants.forEach(grant => {
          console.log(`     ${Object.values(grant)[0]}`);
        });
      } catch (error) {
        console.log(`   ❌ Could not show grants for ${user.username}@${user.host}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Verification complete!');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyPhsarDesign3Setup();
