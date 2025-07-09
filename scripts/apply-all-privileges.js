#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'rbac_system', // Use rbac_system for RBAC operations
  multipleStatements: true
};

async function applyPrivilegesToUser(connection, dbUser, databaseName = '*') {
  try {
    console.log(`🔧 Applying privileges to ${dbUser.username}@${dbUser.host}...`);
    
    // First, revoke all existing privileges for this user to start clean
    try {
      const revokeQuery = `REVOKE ALL PRIVILEGES ON *.* FROM '${dbUser.username}'@'${dbUser.host}'`;
      await connection.execute(revokeQuery);
      console.log(`  ✅ Revoked existing privileges`);
    } catch (error) {
      console.log(`  ℹ️ No existing privileges to revoke (this is normal)`);
    }

    // Get all roles for this user
    const [userRoles] = await connection.execute(`
      SELECT r.role_id, r.name as role_name
      FROM DatabaseUserRoles dur
      INNER JOIN Roles r ON dur.role_id = r.role_id
      WHERE dur.db_user_id = ?
    `, [dbUser.db_user_id]);

    console.log(`  📋 Found ${userRoles.length} roles: ${userRoles.map(r => r.role_name).join(', ')}`);

    // Get all privileges for user's roles
    const privilegeSet = new Set();
    for (const role of userRoles) {
      const [rolePrivileges] = await connection.execute(`
        SELECT p.name
        FROM RolePrivileges rp
        INNER JOIN Privileges p ON rp.privilege_id = p.privilege_id
        WHERE rp.role_id = ?
      `, [role.role_id]);
      
      rolePrivileges.forEach(privilege => {
        privilegeSet.add(privilege.name);
      });
    }

    const privileges = Array.from(privilegeSet);
    console.log(`  📋 Found ${privileges.length} unique privileges: ${privileges.join(', ')}`);

    if (privileges.length > 0) {
      // Handle special privilege mappings
      const mysqlPrivileges = privileges.map(priv => {
        switch (priv) {
          case 'ALL PRIVILEGES':
            return 'ALL PRIVILEGES';
          case 'SHOW DATABASES':
            return 'SHOW DATABASES';
          case 'CREATE USER':
            return 'CREATE USER';
          case 'DROP USER':
            return 'DROP USER';
          case 'GRANT OPTION':
            return 'GRANT OPTION';
          default:
            return priv;
        }
      });

      // Apply privileges
      for (const privilege of mysqlPrivileges) {
        try {
          let grantQuery;
          if (privilege === 'ALL PRIVILEGES') {
            grantQuery = `GRANT ALL PRIVILEGES ON ${databaseName}.* TO '${dbUser.username}'@'${dbUser.host}'`;
          } else if (['CREATE USER', 'DROP USER', 'RELOAD', 'SHUTDOWN', 'PROCESS', 'SUPER'].includes(privilege)) {
            // Global privileges
            grantQuery = `GRANT ${privilege} ON *.* TO '${dbUser.username}'@'${dbUser.host}'`;
          } else {
            // Database-level privileges
            grantQuery = `GRANT ${privilege} ON ${databaseName}.* TO '${dbUser.username}'@'${dbUser.host}'`;
          }
          
          await connection.execute(grantQuery);
          console.log(`    ✅ Granted: ${privilege}`);
        } catch (error) {
          console.error(`    ❌ Failed to grant ${privilege}:`, error.message);
        }
      }
      
      // Flush privileges to ensure changes take effect
      await connection.execute('FLUSH PRIVILEGES');
      console.log(`  ✅ Applied ${mysqlPrivileges.length} privileges to ${dbUser.username}@${dbUser.host}`);
    } else {
      console.log(`  ℹ️ No privileges to apply for ${dbUser.username}@${dbUser.host}`);
    }

  } catch (error) {
    console.error(`❌ Error applying privileges to ${dbUser.username}@${dbUser.host}:`, error);
  }
}

async function applyAllPrivileges() {
  console.log('🔧 Applying privileges to all users with roles...');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection established');
    
    // Get all users with roles
    const [usersWithRoles] = await connection.execute(`
      SELECT DISTINCT du.db_user_id, du.username, du.host
      FROM DatabaseUsers du
      INNER JOIN DatabaseUserRoles dur ON du.db_user_id = dur.db_user_id
      ORDER BY du.username, du.host
    `);
    
    console.log(`📋 Found ${usersWithRoles.length} users with roles assigned\n`);
    
    for (const user of usersWithRoles) {
      await applyPrivilegesToUser(connection, user, 'PhsarDesign3'); // Apply privileges to PhsarDesign3 database
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Privilege application complete!');
    
    // Show final verification
    console.log('\n🔍 Verifying privileges for a sample user...');
    if (usersWithRoles.length > 0) {
      const sampleUser = usersWithRoles[0];
      const [grants] = await connection.execute(`SHOW GRANTS FOR '${sampleUser.username}'@'${sampleUser.host}'`);
      console.log(`📋 Grants for ${sampleUser.username}@${sampleUser.host}:`);
      grants.forEach(grant => {
        console.log(`   ${Object.values(grant)[0]}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during privilege application:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyAllPrivileges();
