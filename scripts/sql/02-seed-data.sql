-- Essential seed data for RBAC system
USE rbac_system;

-- Insert core database roles
INSERT INTO roles (name, description, is_database_role) VALUES
('db_admin', 'Database administrator with full privileges', TRUE),
('db_developer', 'Database developer with development privileges', TRUE),
('db_readonly', 'Read-only access to databases', TRUE),
('db_writer', 'Read and write access to specific databases', TRUE);

-- Insert essential database privileges
INSERT INTO privileges (name, description, privilege_type, mysql_privilege, is_global) VALUES
-- Global administrative privileges
('SELECT', 'Select data from tables', 'DATABASE', 'SELECT', FALSE),
('INSERT', 'Insert data into tables', 'DATABASE', 'INSERT', FALSE),
('UPDATE', 'Update data in tables', 'DATABASE', 'UPDATE', FALSE),
('DELETE', 'Delete data from tables', 'DATABASE', 'DELETE', FALSE),
('CREATE', 'Create databases and tables', 'DATABASE', 'CREATE', FALSE),
('DROP', 'Drop databases and tables', 'DATABASE', 'DROP', FALSE),
('ALTER', 'Alter tables and databases', 'DATABASE', 'ALTER', FALSE),
('INDEX', 'Create and drop indexes', 'DATABASE', 'INDEX', FALSE),
('GRANT OPTION', 'Grant privileges to other users', 'DATABASE', 'GRANT OPTION', FALSE),

-- Administrative privileges
('ALL PRIVILEGES', 'All privileges on all databases', 'DATABASE', 'ALL PRIVILEGES', TRUE),
('CREATE USER', 'Create new database users', 'DATABASE', 'CREATE USER', TRUE),
('DROP USER', 'Drop database users', 'DATABASE', 'DROP USER', TRUE),
('RELOAD', 'Reload privileges and flush caches', 'DATABASE', 'RELOAD', TRUE),
('PROCESS', 'View all processes', 'DATABASE', 'PROCESS', TRUE),
('SUPER', 'Administrative operations', 'DATABASE', 'SUPER', TRUE);

-- Insert sample database users
INSERT INTO DatabaseUsers (username, host, description) VALUES
('admin_user', 'localhost', 'Administrative user with full access'),
('dev_user', '%', 'Development user with limited access'),
('readonly_user', '%', 'Read-only user for reporting'),
('app_user', 'localhost', 'Application user with specific privileges');

-- Assign roles to database users
INSERT INTO DatabaseUserRoles (db_user_id, role_id) VALUES
(1, 1), -- admin_user -> db_admin
(2, 2), -- dev_user -> db_developer  
(3, 3), -- readonly_user -> db_readonly
(4, 4); -- app_user -> db_writer

-- Assign privileges to roles
-- db_admin role gets all privileges
INSERT INTO RolePrivileges (role_id, privilege_id) 
SELECT 1, privilege_id FROM privileges WHERE name IN (
    'ALL PRIVILEGES', 'CREATE USER', 'DROP USER', 'RELOAD', 'PROCESS', 'SUPER'
);

-- db_developer role gets development privileges  
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 2, privilege_id FROM privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'INDEX'
);

-- db_readonly role gets read privileges
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 3, privilege_id FROM privileges WHERE name IN (
    'SELECT'
);

-- db_writer role gets read/write privileges
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 4, privilege_id FROM privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE'
);

-- Insert basic database objects
INSERT INTO DatabaseObjects (object_type, database_name, description) VALUES
('DATABASE', 'rbac_system', 'RBAC System Management Database'),
('DATABASE', 'information_schema', 'MySQL Information Schema (Read-only)'),
('DATABASE', 'performance_schema', 'MySQL Performance Schema (Read-only)');

-- Insert core table objects for rbac_system
INSERT INTO DatabaseObjects (object_type, database_name, table_name, description) VALUES
('TABLE', 'rbac_system', 'DatabaseUsers', 'Database user accounts'),
('TABLE', 'rbac_system', 'roles', 'User roles and permissions'),
('TABLE', 'rbac_system', 'privileges', 'System privileges definitions'),
('TABLE', 'rbac_system', 'DatabaseUserRoles', 'User-role assignments'),
('TABLE', 'rbac_system', 'RolePrivileges', 'Role-privilege assignments'),
('TABLE', 'rbac_system', 'DatabaseObjects', 'Available database objects');
