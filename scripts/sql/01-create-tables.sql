-- RBAC System Database Schema
-- Creates the core tables for Role-Based Access Control system

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS rbac_system;
USE rbac_system;

-- Create Roles table for database roles
CREATE TABLE IF NOT EXISTS roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_database_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_roles_name (name),
    INDEX idx_roles_is_database (is_database_role)
);

-- Create Privileges table for database privileges  
CREATE TABLE IF NOT EXISTS privileges (
    privilege_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    privilege_type ENUM('DATABASE', 'TABLE', 'COLUMN', 'ROUTINE') DEFAULT 'DATABASE',
    target_database VARCHAR(255) NULL,
    target_table VARCHAR(255) NULL,
    mysql_privilege VARCHAR(100) NULL,
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_privileges_name (name),
    INDEX idx_privileges_type (privilege_type),
    INDEX idx_privileges_target_db (target_database),
    INDEX idx_privileges_global (is_global)
);

-- Create DatabaseUsers table to track database users (using original naming for compatibility)
CREATE TABLE IF NOT EXISTS DatabaseUsers (
    db_user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(32) UNIQUE NOT NULL, -- MySQL username limit
    host VARCHAR(255) DEFAULT '%',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username_host (username, host),
    INDEX idx_created_at (created_at)
);

-- Create alias view for consistent naming
CREATE OR REPLACE VIEW db_users AS SELECT * FROM DatabaseUsers;

-- Create Roles alias for consistent naming  
CREATE OR REPLACE VIEW Roles AS SELECT * FROM roles;

-- Create Privileges alias for consistent naming
CREATE OR REPLACE VIEW Privileges AS SELECT * FROM privileges;

-- Create DatabaseUserRoles junction table (using original naming)
CREATE TABLE IF NOT EXISTS DatabaseUserRoles (
    db_user_id INT,
    role_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (db_user_id, role_id),
    FOREIGN KEY (db_user_id) REFERENCES DatabaseUsers(db_user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    INDEX idx_user_roles_user (db_user_id),
    INDEX idx_user_roles_role (role_id)
);

-- Create alias view for consistent naming
CREATE OR REPLACE VIEW user_roles AS SELECT * FROM DatabaseUserRoles;

-- Create RolePrivileges junction table (using original naming)
CREATE TABLE IF NOT EXISTS RolePrivileges (
    role_id INT,
    privilege_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, privilege_id),
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (privilege_id) REFERENCES privileges(privilege_id) ON DELETE CASCADE,
    INDEX idx_role_privileges_role (role_id),
    INDEX idx_role_privileges_privilege (privilege_id)
);

-- Create alias view for consistent naming
CREATE OR REPLACE VIEW role_privileges AS SELECT * FROM RolePrivileges;

-- Create UserSpecificPrivileges table for direct privilege grants to users
CREATE TABLE IF NOT EXISTS UserSpecificPrivileges (
    user_privilege_id INT PRIMARY KEY AUTO_INCREMENT,
    db_user_id INT NOT NULL,
    privilege_type VARCHAR(50) NOT NULL, -- e.g., 'SELECT', 'INSERT', 'UPDATE', etc.
    target_database VARCHAR(255) NOT NULL,
    target_table VARCHAR(255) NULL, -- NULL for database-level privileges
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by VARCHAR(50) DEFAULT 'admin',
    FOREIGN KEY (db_user_id) REFERENCES DatabaseUsers(db_user_id) ON DELETE CASCADE,
    INDEX idx_user_privileges_user (db_user_id),
    INDEX idx_user_privileges_db (target_database),
    INDEX idx_user_privileges_table (target_database, target_table),
    INDEX idx_user_privileges_type (privilege_type)
);

-- Create alias view for consistent naming
CREATE OR REPLACE VIEW user_specific_privileges AS SELECT * FROM UserSpecificPrivileges;

-- Create simplified DatabaseObjects table for basic database/table tracking
CREATE TABLE IF NOT EXISTS DatabaseObjects (
    object_id INT PRIMARY KEY AUTO_INCREMENT,
    object_type ENUM('DATABASE', 'TABLE') NOT NULL,
    database_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NULL, -- NULL for database-level objects
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_database_table (database_name, table_name),
    INDEX idx_object_type (object_type)
);
