import { type NextRequest, NextResponse } from "next/server"
import { serverDb as db } from "@/lib/db-server"

// POST /api/users/[id]/apply-privileges - Apply privileges to database user
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const dbUserId = Number.parseInt(id)
    const body = await request.json()
    const { databaseName } = body

    if (isNaN(dbUserId)) {
      return NextResponse.json({ success: false, error: "Invalid database user ID" }, { status: 400 })
    }

    await db.init()
    
    // Get user info for logging
    const user = await db.getDatabaseUserById(dbUserId)
    if (!user) {
      return NextResponse.json({ success: false, error: "Database user not found" }, { status: 404 })
    }

    // Apply privileges based on assigned roles
    await db.applyPrivilegesToDatabaseUser(dbUserId, databaseName || '*')

    return NextResponse.json({
      success: true,
      message: `Privileges applied successfully to ${user.username}@${user.host}`,
    })
  } catch (error) {
    console.error("Error applying privileges to database user:", error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to apply privileges: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
