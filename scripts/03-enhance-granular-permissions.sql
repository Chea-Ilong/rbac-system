-- Enhanced schema for granular database and table permissions

-- Add new columns to Privileges table for better granular control
ALTER TABLE Privileges 
ADD COLUMN target_database VARCHAR(255) AFTER target_object,
ADD COLUMN target_table VARCHAR(255) AFTER target_database,
ADD COLUMN mysql_privilege VARCHAR(100) AFTER target_table,
ADD COLUMN is_global BOOLEAN DEFAULT FALSE AFTER mysql_privilege;

-- Create DatabaseObjects table to track available databases and tables
CREATE TABLE DatabaseObjects (
    object_id INT PRIMARY KEY AUTO_INCREMENT,
    object_type ENUM('DATABASE', 'TABLE') NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NULL, -- NULL for database-level objects
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_database_table (database_name, table_name)
);

-- Create UserSpecificPrivileges table for direct user-level permissions
CREATE TABLE UserSpecificPrivileges (
    user_privilege_id INT PRIMARY KEY AUTO_INCREMENT,
    db_user_id INT NOT NULL,
    privilege_type ENUM('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'INDEX', 'GRANT') NOT NULL,
    target_database VARCHAR(255) NOT NULL,
    target_table VARCHAR(255) NULL, -- NULL for database-level privileges
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(255) DEFAULT 'system',
    FOREIGN KEY (db_user_id) REFERENCES DatabaseUsers(db_user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_privilege (db_user_id, privilege_type, target_database, target_table)
);

-- Insert available databases and tables into DatabaseObjects
INSERT INTO DatabaseObjects (object_type, database_name, description) VALUES
('DATABASE', 'rbac_system', 'RBAC System Management Database'),
('DATABASE', 'PhsarDesign3', 'PhsarDesign3 Application Database'),
('DATABASE', 'information_schema', 'MySQL Information Schema (Read-only)'),
('DATABASE', 'performance_schema', 'MySQL Performance Schema (Read-only)');

-- Insert table objects for PhsarDesign3
INSERT INTO DatabaseObjects (object_type, database_name, table_name, description) VALUES
('TABLE', 'PhsarDesign3', 'Users', 'User accounts and profiles'),
('TABLE', 'PhsarDesign3', 'Projects', 'Project listings and details'),
('TABLE', 'PhsarDesign3', 'Applications', 'Project applications from freelancers'),
('TABLE', 'PhsarDesign3', 'Messages', 'Communication between users'),
('TABLE', 'PhsarDesign3', 'Clients_profile', 'Client profile information'),
('TABLE', 'PhsarDesign3', 'Freelancers_profile', 'Freelancer profile information');

-- Insert table objects for rbac_system
INSERT INTO DatabaseObjects (object_type, database_name, table_name, description) VALUES
('TABLE', 'rbac_system', 'DatabaseUsers', 'Database user accounts'),
('TABLE', 'rbac_system', 'Roles', 'User roles and permissions'),
('TABLE', 'rbac_system', 'Privileges', 'System privileges definitions'),
('TABLE', 'rbac_system', 'DatabaseUserRoles', 'User-role assignments'),
('TABLE', 'rbac_system', 'RolePrivileges', 'Role-privilege assignments'),
('TABLE', 'rbac_system', 'DatabaseObjects', 'Available database objects'),
('TABLE', 'rbac_system', 'UserSpecificPrivileges', 'Direct user privileges');

-- Add some enhanced privileges with specific database and table targeting
INSERT INTO Privileges (name, description, privilege_type, target_database, target_table, mysql_privilege, is_global) VALUES
-- Global privileges
('GLOBAL_SELECT', 'Global SELECT privilege on all databases', 'DATABASE', '*', NULL, 'SELECT', TRUE),
('GLOBAL_INSERT', 'Global INSERT privilege on all databases', 'DATABASE', '*', NULL, 'INSERT', TRUE),
('GLOBAL_UPDATE', 'Global UPDATE privilege on all databases', 'DATABASE', '*', NULL, 'UPDATE', TRUE),
('GLOBAL_DELETE', 'Global DELETE privilege on all databases', 'DATABASE', '*', NULL, 'DELETE', TRUE),

-- PhsarDesign3 database privileges
('PHSAR_DB_SELECT', 'SELECT access to PhsarDesign3 database', 'DATABASE', 'PhsarDesign3', NULL, 'SELECT', FALSE),
('PHSAR_DB_INSERT', 'INSERT access to PhsarDesign3 database', 'DATABASE', 'PhsarDesign3', NULL, 'INSERT', FALSE),
('PHSAR_DB_UPDATE', 'UPDATE access to PhsarDesign3 database', 'DATABASE', 'PhsarDesign3', NULL, 'UPDATE', FALSE),
('PHSAR_DB_DELETE', 'DELETE access to PhsarDesign3 database', 'DATABASE', 'PhsarDesign3', NULL, 'DELETE', FALSE),

-- PhsarDesign3 table-specific privileges
('PHSAR_USERS_SELECT', 'SELECT access to PhsarDesign3.Users table', 'TABLE', 'PhsarDesign3', 'Users', 'SELECT', FALSE),
('PHSAR_USERS_INSERT', 'INSERT access to PhsarDesign3.Users table', 'TABLE', 'PhsarDesign3', 'Users', 'INSERT', FALSE),
('PHSAR_USERS_UPDATE', 'UPDATE access to PhsarDesign3.Users table', 'TABLE', 'PhsarDesign3', 'Users', 'UPDATE', FALSE),
('PHSAR_USERS_DELETE', 'DELETE access to PhsarDesign3.Users table', 'TABLE', 'PhsarDesign3', 'Users', 'DELETE', FALSE),

('PHSAR_PROJECTS_SELECT', 'SELECT access to PhsarDesign3.Projects table', 'TABLE', 'PhsarDesign3', 'Projects', 'SELECT', FALSE),
('PHSAR_PROJECTS_INSERT', 'INSERT access to PhsarDesign3.Projects table', 'TABLE', 'PhsarDesign3', 'Projects', 'INSERT', FALSE),
('PHSAR_PROJECTS_UPDATE', 'UPDATE access to PhsarDesign3.Projects table', 'TABLE', 'PhsarDesign3', 'Projects', 'UPDATE', FALSE),
('PHSAR_PROJECTS_DELETE', 'DELETE access to PhsarDesign3.Projects table', 'TABLE', 'PhsarDesign3', 'Projects', 'DELETE', FALSE),

-- RBAC system privileges
('RBAC_DB_SELECT', 'SELECT access to rbac_system database', 'DATABASE', 'rbac_system', NULL, 'SELECT', FALSE),
('RBAC_DB_INSERT', 'INSERT access to rbac_system database', 'DATABASE', 'rbac_system', NULL, 'INSERT', FALSE),
('RBAC_DB_UPDATE', 'UPDATE access to rbac_system database', 'DATABASE', 'rbac_system', NULL, 'UPDATE', FALSE),
('RBAC_DB_DELETE', 'DELETE access to rbac_system database', 'DATABASE', 'rbac_system', NULL, 'DELETE', FALSE);
