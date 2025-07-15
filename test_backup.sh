#!/bin/bash

echo "=== Database Backup & Restore Test ==="

# Test database credentials
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD="long123"
DB_NAME="rbac_system"

# Create a test table to verify backup/restore
echo "1. Creating test data..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" << EOF
CREATE TABLE IF NOT EXISTS backup_test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_data VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO backup_test (test_data) VALUES 
('Test record 1'), 
('Test record 2'), 
('Test record 3');
EOF

if [ $? -eq 0 ]; then
    echo "✅ Test data created successfully"
else
    echo "❌ Failed to create test data"
    exit 1
fi

echo "2. Checking test data..."
RECORD_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM backup_test;")
echo "Records in backup_test: $RECORD_COUNT"

echo "3. Now you can test the backup/restore through the web interface:"
echo "   - Go to http://localhost:3000"
echo "   - Navigate to Backup & Recovery tab"
echo "   - Create a backup of rbac_system database"
echo "   - Delete the test table: DROP TABLE backup_test;"
echo "   - Restore the backup"
echo "   - Verify the table and data are restored"

echo ""
echo "=== To manually verify after restore ==="
echo "mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e 'SELECT * FROM backup_test;'"
