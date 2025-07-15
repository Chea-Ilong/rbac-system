require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function initBackupTables() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rbac_system'
    });

    console.log('Connected to database, creating backup tables...');

    await connection.execute(`
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
      )
    `);

    console.log('✅ BackupJobs table created successfully');

    // Create backups directory
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log('✅ Backups directory created');
    } else {
      console.log('✅ Backups directory already exists');
    }

    await connection.end();
    console.log('✅ Backup initialization complete');
  } catch (error) {
    console.error('❌ Error initializing backup tables:', error);
    process.exit(1);
  }
}

initBackupTables();
