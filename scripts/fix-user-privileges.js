const { pool } = require('../lib/database-config.ts');

async function fixPrivilegesAndUser() {
  const connection = await pool.getConnection();
  try {
    console.log('🔧 Fixing mysql_privilege values...');
    
    // Update null mysql_privilege values to match the privilege names
    await connection.execute(`
      UPDATE Privileges 
      SET mysql_privilege = name 
      WHERE mysql_privilege IS NULL AND name IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'INDEX', 'GRANT')
    `);
    
    console.log('✅ Updated mysql_privilege values');
    
    console.log('🧹 Cleaning up user heang privileges...');
    
    // Revoke all existing privileges from heang
    try {
      await connection.execute(`REVOKE ALL PRIVILEGES ON *.* FROM 'heang'@'%'`);
      console.log('✅ Revoked global privileges from heang');
    } catch (error) {
      console.log('ℹ️ No global privileges to revoke for heang');
    }
    
    try {
      await connection.execute(`REVOKE ALL PRIVILEGES ON \`test\`.* FROM 'heang'@'%'`);
      console.log('✅ Revoked test database privileges from heang');
    } catch (error) {
      console.log('ℹ️ No test database privileges to revoke for heang');
    }
    
    // Keep only the basic connection privilege
    await connection.execute(`GRANT USAGE ON *.* TO 'heang'@'%'`);
    console.log('✅ Granted basic USAGE privilege to heang');
    
    await connection.execute('FLUSH PRIVILEGES');
    console.log('✅ Flushed privileges');
    
    console.log('🎉 Cleanup complete! Now re-assign the scoped role through the UI.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

fixPrivilegesAndUser().catch(console.error);
