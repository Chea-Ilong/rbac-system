-- Performance optimization indexes for RBAC system
-- Run this script to add indexes that will speed up common queries
USE rbac_system;

-- DatabaseUsers table optimizations (main table)
CREATE INDEX IF NOT EXISTS idx_DatabaseUsers_username ON DatabaseUsers(username);
CREATE INDEX IF NOT EXISTS idx_DatabaseUsers_host ON DatabaseUsers(host);
CREATE INDEX IF NOT EXISTS idx_DatabaseUsers_created_at ON DatabaseUsers(created_at);

-- roles table optimizations  
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_database_role ON roles(is_database_role);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON roles(created_at);

-- privileges table optimizations
CREATE INDEX IF NOT EXISTS idx_privileges_name ON privileges(name);
CREATE INDEX IF NOT EXISTS idx_privileges_type ON privileges(privilege_type);
CREATE INDEX IF NOT EXISTS idx_privileges_target_db ON privileges(target_database);
CREATE INDEX IF NOT EXISTS idx_privileges_target_table ON privileges(target_table);
CREATE INDEX IF NOT EXISTS idx_privileges_global ON privileges(is_global);

-- DatabaseUserRoles junction table - critical for performance
CREATE INDEX IF NOT EXISTS idx_DatabaseUserRoles_user_id ON DatabaseUserRoles(db_user_id);
CREATE INDEX IF NOT EXISTS idx_DatabaseUserRoles_role_id ON DatabaseUserRoles(role_id);
CREATE INDEX IF NOT EXISTS idx_DatabaseUserRoles_composite ON DatabaseUserRoles(db_user_id, role_id);

-- RolePrivileges junction table - critical for performance  
CREATE INDEX IF NOT EXISTS idx_RolePrivileges_role_id ON RolePrivileges(role_id);
CREATE INDEX IF NOT EXISTS idx_RolePrivileges_privilege_id ON RolePrivileges(privilege_id);
CREATE INDEX IF NOT EXISTS idx_RolePrivileges_composite ON RolePrivileges(role_id, privilege_id);

-- DatabaseObjects table optimizations
CREATE INDEX IF NOT EXISTS idx_DatabaseObjects_type ON DatabaseObjects(object_type);
CREATE INDEX IF NOT EXISTS idx_DatabaseObjects_database ON DatabaseObjects(database_name);
CREATE INDEX IF NOT EXISTS idx_DatabaseObjects_table ON DatabaseObjects(table_name);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_DatabaseUserRoles_full ON DatabaseUserRoles(db_user_id, role_id, assigned_at);
CREATE INDEX IF NOT EXISTS idx_RolePrivileges_full ON RolePrivileges(role_id, privilege_id, assigned_at);

-- Covering indexes for frequently selected columns (without TEXT fields to avoid key length issues)
CREATE INDEX IF NOT EXISTS idx_DatabaseUsers_list_view ON DatabaseUsers(db_user_id, username, host, created_at);
CREATE INDEX IF NOT EXISTS idx_roles_list_view ON roles(role_id, name, is_database_role, created_at);
CREATE INDEX IF NOT EXISTS idx_privileges_list_view ON privileges(privilege_id, name, privilege_type, is_global, created_at);

-- Analyze tables after creating indexes for optimal query planning
ANALYZE TABLE DatabaseUsers;
ANALYZE TABLE roles;
ANALYZE TABLE privileges;
ANALYZE TABLE DatabaseUserRoles;
ANALYZE TABLE RolePrivileges;
ANALYZE TABLE DatabaseObjects;
CREATE INDEX IF NOT EXISTS idx_privileges_list_view ON privileges(privilege_id, name, description, privilege_type, is_global, created_at);

-- Analyze tables after creating indexes for optimal query planning
ANALYZE TABLE db_users;
ANALYZE TABLE roles;
ANALYZE TABLE privileges;
ANALYZE TABLE user_roles;
ANALYZE TABLE role_privileges;
ANALYZE TABLE user_specific_privileges;
ANALYZE TABLE scoped_role_assignments;
ANALYZE TABLE database_objects;

-- Show index usage statistics
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    CARDINALITY,
    NULLABLE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
