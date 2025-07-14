const { serverDb } = require('../lib/db-server.ts');

async function testScopedRoleRevocation() {
  try {
    console.log('Testing scoped role revocation fix...');
    
    // Test case 1: Create a test user (if doesn't exist)
    let testUser;
    try {
      testUser = await serverDb.createDatabaseUser({
        username: 'test_scoped_user',
        host: '%',
        password: 'test123',
        description: 'Test user for scoped role revocation'
      });
      console.log('✓ Created test user:', testUser);
    } catch (error) {
      // User might already exist, try to get it
      const users = await serverDb.getDatabaseUsers();
      testUser = users.find(u => u.username === 'test_scoped_user');
      if (!testUser) {
        throw new Error('Could not create or find test user');
      }
      console.log('✓ Found existing test user:', testUser);
    }
    
    // Test case 2: Get a test role
    const roles = await serverDb.getRoles();
    const testRole = roles.find(r => r.name === 'Developer' || r.name === 'Analyst');
    if (!testRole) {
      throw new Error('No test role found. Need at least one role in the system.');
    }
    console.log('✓ Using test role:', testRole);
    
    // Test case 3: Assign a GLOBAL scoped role
    const globalAssignment = await serverDb.assignScopedRoleToDatabaseUser({
      dbUserId: testUser.db_user_id,
      roleId: testRole.role_id,
      scopeType: 'GLOBAL',
      assignedBy: 'test-system'
    });
    console.log('✓ Assigned global scoped role:', globalAssignment);
    
    // Test case 4: Revoke the GLOBAL scoped role (this should not fail with SQL syntax error)
    await serverDb.revokeScopedRoleFromDatabaseUser(globalAssignment.userRoleId);
    console.log('✓ Successfully revoked global scoped role - NO SQL SYNTAX ERROR!');
    
    // Test case 5: Test with DATABASE scope (should also work)
    const dbAssignment = await serverDb.assignScopedRoleToDatabaseUser({
      dbUserId: testUser.db_user_id,
      roleId: testRole.role_id,
      scopeType: 'DATABASE',
      targetDatabase: 'test',
      assignedBy: 'test-system'
    });
    console.log('✓ Assigned database scoped role:', dbAssignment);
    
    await serverDb.revokeScopedRoleFromDatabaseUser(dbAssignment.userRoleId);
    console.log('✓ Successfully revoked database scoped role');
    
    // Cleanup: Delete test user
    await serverDb.deleteDatabaseUser(testUser.db_user_id);
    console.log('✓ Cleaned up test user');
    
    console.log('\n🎉 ALL TESTS PASSED! The scoped role revocation fix is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Only run the test if this script is executed directly
if (require.main === module) {
  testScopedRoleRevocation().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { testScopedRoleRevocation };
