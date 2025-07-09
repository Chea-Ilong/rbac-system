-- Insert default database roles
INSERT INTO Roles (name, description, is_database_role) VALUES
('db_admin', 'Database administrator with full privileges', TRUE),
('db_developer', 'Database developer with development privileges', TRUE),
('db_readonly', 'Read-only access to databases', TRUE),
('db_writer', 'Read and write access to specific databases', TRUE),
-- Application-level roles for PhsarDesign3
('Admin', 'Full system access and user management', FALSE),
('Client', 'Can post projects and manage applications', FALSE),
('Freelancer', 'Can apply to projects and manage profile', FALSE),
('Moderator', 'Can review reports and resolve disputes', FALSE);

-- Insert default database privileges
INSERT INTO Privileges (name, description, privilege_type) VALUES
-- Global privileges
('ALL PRIVILEGES', 'All privileges on all databases', 'DATABASE'),
('CREATE USER', 'Create new database users', 'DATABASE'),
('DROP USER', 'Drop database users', 'DATABASE'),
('RELOAD', 'Reload privileges and flush caches', 'DATABASE'),
('SHUTDOWN', 'Shutdown the MySQL server', 'DATABASE'),
('PROCESS', 'View all processes', 'DATABASE'),
('FILE', 'Read and write files on server', 'DATABASE'),
('REFERENCES', 'Create foreign keys', 'DATABASE'),
('INDEX', 'Create and drop indexes', 'DATABASE'),
('ALTER', 'Alter tables and databases', 'DATABASE'),
('SHOW DATABASES', 'Show all databases', 'DATABASE'),
('SUPER', 'Administrative operations', 'DATABASE'),
('CREATE TEMPORARY TABLES', 'Create temporary tables', 'DATABASE'),
('LOCK TABLES', 'Lock tables for reading', 'DATABASE'),
('EXECUTE', 'Execute stored procedures', 'DATABASE'),
('REPLICATION SLAVE', 'Replication slave privileges', 'DATABASE'),
('REPLICATION CLIENT', 'Replication client privileges', 'DATABASE'),
('CREATE VIEW', 'Create views', 'DATABASE'),
('SHOW VIEW', 'Show view definitions', 'DATABASE'),
('CREATE ROUTINE', 'Create stored procedures and functions', 'DATABASE'),
('ALTER ROUTINE', 'Alter stored procedures and functions', 'DATABASE'),
('EVENT', 'Create and manage events', 'DATABASE'),
('TRIGGER', 'Create and manage triggers', 'DATABASE'),

-- Database-specific privileges
('SELECT', 'Select data from tables', 'DATABASE'),
('INSERT', 'Insert data into tables', 'DATABASE'),
('UPDATE', 'Update data in tables', 'DATABASE'),
('DELETE', 'Delete data from tables', 'DATABASE'),
('CREATE', 'Create databases and tables', 'DATABASE'),
('DROP', 'Drop databases and tables', 'DATABASE'),
('GRANT OPTION', 'Grant privileges to other users', 'DATABASE'),

-- Application-level privileges for PhsarDesign3
('manage_users', 'Create, edit, and delete users', 'DATABASE'),
('assign_roles', 'Assign and remove user roles', 'DATABASE'),
('create_project', 'Create new projects', 'DATABASE'),
('view_applications', 'View project applications', 'DATABASE'),
('apply_project', 'Apply to projects', 'DATABASE'),
('review_reports', 'Review and handle user reports', 'DATABASE'),
('manage_roles', 'Create and edit roles', 'DATABASE'),
('manage_privileges', 'Assign privileges to roles', 'DATABASE');

-- Insert sample database users (these should correspond to actual MySQL users)
INSERT INTO DatabaseUsers (username, host, description) VALUES
('admin_user', 'localhost', 'Administrative user with full access'),
('dev_user', '%', 'Development user with limited access'),
('readonly_user', '%', 'Read-only user for reporting'),
('app_user', 'localhost', 'Application user with specific privileges'),
-- PhsarDesign3 application users
('phsar_admin', 'localhost', 'Admin user for PhsarDesign3 platform'),
('phsar_client', '%', 'Client user for PhsarDesign3 platform'),
('phsar_freelancer', '%', 'Freelancer user for PhsarDesign3 platform'),
('phsar_moderator', 'localhost', 'Moderator user for PhsarDesign3 platform');

-- Assign roles to database users
INSERT INTO DatabaseUserRoles (db_user_id, role_id) VALUES
(1, 1), -- admin_user -> db_admin
(2, 2), -- dev_user -> db_developer  
(3, 3), -- readonly_user -> db_readonly
(4, 4), -- app_user -> db_writer
-- PhsarDesign3 application users
(5, 5), -- phsar_admin -> Admin
(6, 6), -- phsar_client -> Client
(7, 7), -- phsar_freelancer -> Freelancer
(8, 8); -- phsar_moderator -> Moderator

-- Assign privileges to roles
-- db_admin role gets all privileges
INSERT INTO RolePrivileges (role_id, privilege_id) 
SELECT 1, privilege_id FROM Privileges WHERE name IN (
    'ALL PRIVILEGES', 'CREATE USER', 'DROP USER', 'RELOAD', 'PROCESS', 'SUPER'
);

-- db_developer role gets development privileges  
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 2, privilege_id FROM Privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 
    'INDEX', 'CREATE VIEW', 'SHOW VIEW', 'CREATE ROUTINE', 'ALTER ROUTINE',
    'CREATE TEMPORARY TABLES', 'LOCK TABLES', 'EXECUTE'
);

-- db_readonly role gets read privileges
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 3, privilege_id FROM Privileges WHERE name IN (
    'SELECT', 'SHOW DATABASES', 'SHOW VIEW'
);

-- db_writer role gets read/write privileges
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 4, privilege_id FROM Privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE TEMPORARY TABLES', 'LOCK TABLES'
);

-- Admin role gets full privileges for PhsarDesign3
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 5, privilege_id FROM Privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'INDEX',
    'manage_users', 'assign_roles', 'manage_roles', 'manage_privileges',
    'create_project', 'view_applications', 'review_reports'
);

-- Client role gets project management privileges
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 6, privilege_id FROM Privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE',
    'create_project', 'view_applications'
);

-- Freelancer role gets profile and application privileges
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 7, privilege_id FROM Privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE',
    'apply_project'
);

-- Moderator role gets review and reporting privileges
INSERT INTO RolePrivileges (role_id, privilege_id)
SELECT 8, privilege_id FROM Privileges WHERE name IN (
    'SELECT', 'INSERT', 'UPDATE',
    'review_reports', 'view_applications'
);
