const { pool } = require('../lib/database-config.ts');

async function checkUserPrivileges() {
  try {
    console.log('Checking privileges for user heang...\n');
    
    // Show grants for the user
    const [grants] = await pool.execute(`SHOW GRANTS FOR 'heang'@'%'`);
    
    console.log('Current MySQL grants for heang@%:');
    grants.forEach((grant, index) => {
      console.log(`${index + 1}. ${Object.values(grant)[0]}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Check what's in our tracking tables
    const [userRoles] = await pool.execute(`
      SELECT 
        dur.user_role_id,
        r.name as role_name,
        dur.scope_type,
        dur.target_database,
        dur.target_table,
        dur.assigned_at
      FROM DatabaseUserRoles dur 
      JOIN Roles r ON dur.role_id = r.role_id 
      JOIN DatabaseUsers du ON dur.db_user_id = du.db_user_id
      WHERE du.username = 'heang' AND dur.is_active = TRUE
    `);
    
    console.log('\nScoped role assignments in our system:');
    if (userRoles.length === 0) {
      console.log('No scoped roles found for user heang');
    } else {
      userRoles.forEach((role, index) => {
        console.log(`${index + 1}. Role: ${role.role_name}`);
        console.log(`   Scope: ${role.scope_type}`);
        console.log(`   Database: ${role.target_database || 'ALL'}`);
        console.log(`   Table: ${role.target_table || 'ALL'}`);
        console.log(`   Assigned: ${role.assigned_at}`);
        console.log('');
      });
    }
    
    // Check role privileges
    console.log('Role privileges:');
    for (const role of userRoles) {
      const [rolePrivs] = await pool.execute(`
        SELECT p.name, p.mysql_privilege, p.privilege_type
        FROM Privileges p
        JOIN RolePrivileges rp ON p.privilege_id = rp.privilege_id
        WHERE rp.role_id = (SELECT role_id FROM Roles WHERE name = ?)
      `, [role.role_name]);
      
      console.log(`\nPrivileges for role "${role.role_name}":`);
      rolePrivs.forEach(priv => {
        console.log(`  - ${priv.name} (${priv.mysql_privilege}) [${priv.privilege_type}]`);
      });
    }
    
  } catch (error) {
    console.error('Error checking user privileges:', error);
  } finally {
    process.exit(0);
  }
}

checkUserPrivileges();
