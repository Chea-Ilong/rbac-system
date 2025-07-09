-- Create Roles table for database roles
CREATE TABLE Roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_database_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Privileges table for database privileges
CREATE TABLE Privileges (
    privilege_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    privilege_type ENUM('DATABASE', 'TABLE', 'COLUMN', 'ROUTINE') DEFAULT 'DATABASE',
    target_object VARCHAR(255), -- Database, table, or routine name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create DatabaseUsers table to track database users
CREATE TABLE DatabaseUsers (
    db_user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(32) UNIQUE NOT NULL, -- MySQL username limit
    host VARCHAR(255) DEFAULT '%',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username_host (username, host)
);

-- Create DatabaseUserRoles junction table
CREATE TABLE DatabaseUserRoles (
    db_user_id INT,
    role_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (db_user_id, role_id),
    FOREIGN KEY (db_user_id) REFERENCES DatabaseUsers(db_user_id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE
);

-- Create RolePrivileges junction table
CREATE TABLE RolePrivileges (
    role_id INT,
    privilege_id INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, privilege_id),
    FOREIGN KEY (role_id) REFERENCES Roles(role_id) ON DELETE CASCADE,
    FOREIGN KEY (privilege_id) REFERENCES Privileges(privilege_id) ON DELETE CASCADE
);
