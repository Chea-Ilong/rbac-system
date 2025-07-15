-- Create backup jobs table for tracking backup operations
CREATE TABLE IF NOT EXISTS BackupJobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('full', 'schema-only', 'data-only', 'selective') NOT NULL,
    status ENUM('in-progress', 'completed', 'failed') NOT NULL DEFAULT 'in-progress',
    config JSON NOT NULL,
    progress INT DEFAULT 0,
    status_message TEXT,
    error_message TEXT,
    file_path VARCHAR(500),
    file_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create backups directory structure
-- Note: This will be handled by the Node.js application
