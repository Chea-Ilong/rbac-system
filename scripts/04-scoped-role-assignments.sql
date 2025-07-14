-- Enhanced schema for scoped role assignments
-- This allows the same role to be assigned to users with different database/table scopes

-- Drop the existing simple junction table
DROP TABLE IF EXISTS DatabaseUserRoles;

-- Create enhanced DatabaseUserRoles table with scope targeting
CREATE TABLE DatabaseUserRoles (
    user_role_id INT PRIMARY KEY AUTO_INCREMENT,
    db_user_id INT NOT NULL,
    role_id INT NOT NULL,
    scope_type ENUM('GLOBAL', 'DATABASE', 'TABLE') DEFAULT 'GLOBAL',
    target_database VARCHAR(255) NULL, -- NULL for global scope
    target_table VARCHAR(255) NULL, -- NULL for database-level or global scope
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(255) DEFAULT 'system',
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (db_user_id) REFERENCES DatabaseUsers(db_user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    
    -- Ensure no duplicate assignments for the same user/role/scope combination
    UNIQUE KEY unique_user_role_scope (db_user_id, role_id, scope_type, target_database, target_table),
    
    INDEX idx_user_roles (db_user_id),
    INDEX idx_role_assignments (role_id),
    INDEX idx_scope_lookup (scope_type, target_database, target_table)
);

-- Create a view to easily see effective privileges for users
CREATE OR REPLACE VIEW UserEffectivePermissions AS
SELECT 
    u.db_user_id,
    u.username,
    u.host,
    r.role_id,
    r.name as role_name,
    ur.scope_type,
    ur.target_database,
    ur.target_table,
    p.privilege_id,
    p.name as privilege_name,
    p.mysql_privilege,
    p.privilege_type,
    CASE 
        WHEN ur.scope_type = 'GLOBAL' THEN '*'
        WHEN ur.scope_type = 'DATABASE' THEN COALESCE(ur.target_database, '*')
        WHEN ur.scope_type = 'TABLE' THEN CONCAT(COALESCE(ur.target_database, '*'), '.', COALESCE(ur.target_table, '*'))
        ELSE '*'
    END as effective_scope,
    ur.assigned_at,
    ur.is_active
FROM DatabaseUsers u
JOIN DatabaseUserRoles ur ON u.db_user_id = ur.db_user_id
JOIN Roles r ON ur.role_id = r.role_id
JOIN RolePrivileges rp ON r.role_id = rp.role_id
JOIN Privileges p ON rp.privilege_id = p.privilege_id
WHERE ur.is_active = TRUE
ORDER BY u.username, r.name, p.name;

-- Add some sample scoped role assignments for testing
-- Note: Only insert if the users exist
INSERT IGNORE INTO DatabaseUserRoles (db_user_id, role_id, scope_type, target_database, target_table, assigned_by) 
SELECT 
    du.db_user_id,
    r.role_id,
    'DATABASE',
    'PhsarDesign3',
    NULL,
    'admin'
FROM DatabaseUsers du, Roles r 
WHERE du.username = 'phsar_admin' 
AND r.name = 'Admin'
LIMIT 1;

INSERT IGNORE INTO DatabaseUserRoles (db_user_id, role_id, scope_type, target_database, target_table, assigned_by) 
SELECT 
    du.db_user_id,
    r.role_id,
    'TABLE',
    'PhsarDesign3',
    'Users',
    'admin'
FROM DatabaseUsers du, Roles r 
WHERE du.username = 'phsar_client' 
AND r.name = 'Client'
LIMIT 1;
