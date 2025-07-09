const mysql = require("mysql2/promise")

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function verifyDatabase() {
  const config = {
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "3306"),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "rbac_system",
  }

  console.log("🔍 Verifying database connection...")
  console.log("📋 Configuration:", {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  })

  try {
    // Test connection
    const connection = await mysql.createConnection(config)
    console.log("✅ Database connection successful!")

    // Check if tables exist (updated for new schema)
    const tables = ["DatabaseUsers", "Roles", "Privileges", "DatabaseUserRoles", "RolePrivileges"]

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`)
        console.log(`✅ Table ${table}: ${rows[0].count} records`)
      } catch (error) {
        console.log(`❌ Table ${table}: Not found or error - ${error.message}`)
      }
    }

    // Query and display database users
    console.log("\n📋 Database Users:")
    try {
      const [users] = await connection.execute(`
        SELECT du.db_user_id, du.username, du.host, du.description, du.created_at
        FROM DatabaseUsers du
        ORDER BY du.created_at DESC
      `)
      
      if (users.length > 0) {
        users.forEach(user => {
          console.log(`   - ${user.username}@${user.host} (ID: ${user.db_user_id}) - ${user.description || 'No description'}`)
        })
      } else {
        console.log("   No database users found")
      }
    } catch (error) {
      console.log("❌ Failed to query database users:", error.message)
    }

    // Query database users with their roles
    console.log("\n🔐 Database Users with Roles:")
    try {
      const [userRoles] = await connection.execute(`
        SELECT 
          du.username,
          du.host,
          du.description,
          GROUP_CONCAT(r.name) as roles
        FROM DatabaseUsers du
        LEFT JOIN DatabaseUserRoles dur ON du.db_user_id = dur.db_user_id
        LEFT JOIN Roles r ON dur.role_id = r.role_id
        GROUP BY du.db_user_id
        ORDER BY du.username
      `)
      
      if (userRoles.length > 0) {
        userRoles.forEach(user => {
          console.log(`   - ${user.username}@${user.host}: [${user.roles || 'No roles'}]`)
        })
      } else {
        console.log("   No database users found")
      }
    } catch (error) {
      console.log("❌ Failed to query user roles:", error.message)
    }

    // Test insert (create a test database user)
    try {
      const testUsername = `test_user_${Date.now()}`
      const [result] = await connection.execute(
        "INSERT INTO DatabaseUsers (username, host, description) VALUES (?, ?, ?)", 
        [testUsername, '%', 'Test database user for verification']
      )
      console.log("\n✅ Insert test successful, ID:", result.insertId)

      // Clean up test user
      await connection.execute("DELETE FROM DatabaseUsers WHERE db_user_id = ?", [result.insertId])
      console.log("✅ Test database user cleaned up")
    } catch (error) {
      console.log("\n❌ Insert test failed:", error.message)
    }

    await connection.end()
    console.log("\n🎉 Database verification complete!")
  } catch (error) {
    console.error("❌ Database verification failed:", error.message)
    console.error("💡 Please check:")
    console.error("   - MariaDB/MySQL server is running")
    console.error("   - Database credentials are correct")
    console.error("   - Database and tables exist")
    console.error("   - Network connectivity")
  }
}

verifyDatabase()
