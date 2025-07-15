#!/bin/bash

# Test script to debug MySQL restore issues
echo "=== Testing MySQL Restore ==="

# Create a test config file
cat > /tmp/test_mysql.cnf << EOF
[client]
host=localhost
user=root
password=long123
EOF

echo "1. Testing basic MySQL connection..."
mysql --defaults-extra-file=/tmp/test_mysql.cnf -e "SELECT 'Connection successful' as test;"

if [ $? -eq 0 ]; then
    echo "✅ MySQL connection successful"
else
    echo "❌ MySQL connection failed"
    exit 1
fi

echo "2. Testing backup file decompression..."
BACKUP_FILE="/home/long/Desktop/rbac-system (5) (Copy)/backups/testingbackup_2025-07-15T11-43-40.sql.gz"

if [ -f "$BACKUP_FILE" ]; then
    echo "✅ Backup file exists"
    echo "3. Testing zcat command..."
    zcat "$BACKUP_FILE" | head -5
    echo "4. Testing complete restore command..."
    zcat "$BACKUP_FILE" | mysql --defaults-extra-file=/tmp/test_mysql.cnf --verbose
    RESTORE_EXIT_CODE=$?
    echo "Restore exit code: $RESTORE_EXIT_CODE"
else
    echo "❌ Backup file not found: $BACKUP_FILE"
fi

# Cleanup
rm -f /tmp/test_mysql.cnf

echo "=== Test completed ==="
