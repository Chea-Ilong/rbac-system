import { db } from "./db"

export async function initializeDatabase() {
  try {
    console.log("Initializing database...")

    // Initialize the database connection
    await db.init()

    // Check if we have initial data
    const dbUsers = await db.getDatabaseUsers()
    const roles = await db.getRoles()
    const privileges = await db.getPrivileges()

    console.log("Database initialized with:")
    console.log("- Database Users:", dbUsers.length)
    console.log("- Roles:", roles.length)
    console.log("- Privileges:", privileges.length)

    return {
      success: true,
      data: { database_users: dbUsers, roles, privileges },
    }
  } catch (error) {
    console.error("Failed to initialize database:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
