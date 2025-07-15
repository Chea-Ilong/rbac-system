-- Fix DatabaseUserRoles table to allow multiple scoped assignments
-- This script modifies the table to support multiple assignments of the same role to the same user with different scopes

USE rbac_system;

-- Step 1: Drop the existing primary key constraint
ALTER TABLE DatabaseUserRoles DROP PRIMARY KEY;

-- Step 2: Add an auto-increment ID column as the new primary key
ALTER TABLE DatabaseUserRoles ADD COLUMN assignment_id INT AUTO_INCREMENT PRIMARY KEY FIRST;

-- Step 3: Add a unique constraint to prevent true duplicates (same user, role, scope, target)
-- This allows the same user-role combination with different scopes but prevents identical assignments
ALTER TABLE DatabaseUserRoles ADD UNIQUE INDEX idx_unique_assignment (
    db_user_id, 
    role_id, 
    scope_type, 
    target_database, 
    target_table
);

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_assignments ON DatabaseUserRoles(db_user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments ON DatabaseUserRoles(role_id);
CREATE INDEX IF NOT EXISTS idx_scope_assignments ON DatabaseUserRoles(scope_type, target_database, target_table);

-- Display the new table structure
DESCRIBE DatabaseUserRoles;

-- Show current assignments to verify the change worked
SELECT 
    assignment_id,
    db_user_id,
    role_id,
    scope_type,
    target_database,
    target_table,
    assigned_by,
    assigned_at
FROM DatabaseUserRoles
ORDER BY db_user_id, role_id, assigned_at;
