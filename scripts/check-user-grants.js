const mysql = require('mysql2/promise');

async function checkUserGrants() {
  let connection;
  try {
    // Create connection to MariaDB - using same config as the app
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rbac_system'
    });

    console.log('Connected to MariaDB successfully!');

    // Check grants for user 'heang'@'%'
    console.log('\n=== GRANTS for heang@% ===');
    try {
      const [grants] = await connection.execute("SHOW GRANTS FOR 'heang'@'%'");
      grants.forEach((grant, index) => {
        console.log(`${index + 1}. ${Object.values(grant)[0]}`);
      });
    } catch (error) {
      console.log('Error checking grants for heang@%:', error.message);
    }

    // Check our scoped role assignments
    console.log('\n=== SCOPED ROLE ASSIGNMENTS ===');
    const [scopedRoles] = await connection.execute(`
      SELECT 
        u.username,
        r.name as role_name,
        sra.scope_type,
        sra.target_database,
        sra.target_table,
        sra.created_at
      FROM ScopedRoleAssignments sra
      JOIN DatabaseUsers u ON sra.user_id = u.user_id
      JOIN Roles r ON sra.role_id = r.role_id
      WHERE u.username = 'heang'
      ORDER BY sra.created_at DESC
    `);
    
    console.log('Scoped role assignments for heang:');
    scopedRoles.forEach((assignment, index) => {
      console.log(`${index + 1}. Role: ${assignment.role_name}, Scope: ${assignment.scope_type}, Database: ${assignment.target_database || 'N/A'}, Table: ${assignment.target_table || 'N/A'}`);
    });

    // Check what privileges are in the assigned roles
    console.log('\n=== ROLE PRIVILEGES ===');
    const [rolePrivs] = await connection.execute(`
      SELECT DISTINCT
        r.name as role_name,
        p.mysql_privilege,
        p.privilege_type
      FROM ScopedRoleAssignments sra
      JOIN Roles r ON sra.role_id = r.role_id
      JOIN RolePrivileges rp ON r.role_id = rp.role_id
      JOIN Privileges p ON rp.privilege_id = p.privilege_id
      JOIN DatabaseUsers u ON sra.user_id = u.user_id
      WHERE u.username = 'heang'
    `);
    
    console.log('Privileges in assigned roles:');
    rolePrivs.forEach((priv, index) => {
      console.log(`${index + 1}. Role: ${priv.role_name}, MySQL Privilege: ${priv.mysql_privilege}, Type: ${priv.privilege_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserGrants();
