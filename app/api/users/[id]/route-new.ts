import { type NextRequest, NextResponse } from "next/server"
import { serverDb as db } from "@/lib/db-server"

// Simple notification function (real-time service will be handled separately)
function notifyRealTime(eventType: string, data: any, message?: string) {
  console.log(`Real-time event: ${eventType}`, data);
  if (message) console.log(`Notification: ${message}`);
}

// GET /api/users/[id] - Get database user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUserId = Number.parseInt(params.id)

    if (isNaN(dbUserId)) {
      return NextResponse.json({ success: false, error: "Invalid database user ID" }, { status: 400 })
    }

    await db.init()
    const user = await db.getDatabaseUserById(dbUserId)

    if (!user) {
      return NextResponse.json({ success: false, error: "Database user not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Error fetching database user:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch database user" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update database user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUserId = Number.parseInt(params.id)
    const body = await request.json()
    const { username, host, description } = body

    if (isNaN(dbUserId)) {
      return NextResponse.json({ success: false, error: "Invalid database user ID" }, { status: 400 })
    }

    await db.init()
    const updatedUser = await db.updateDatabaseUser(dbUserId, { username, host, description })

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "Database user not found" }, { status: 404 })
    }

    // Notify real-time clients
    notifyRealTime('database-user-updated', updatedUser, `Database user ${updatedUser.username} updated`)

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error("Error updating database user:", error)
    return NextResponse.json({ success: false, error: "Failed to update database user" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete database user
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUserId = Number.parseInt(params.id)

    if (isNaN(dbUserId)) {
      return NextResponse.json({ success: false, error: "Invalid database user ID" }, { status: 400 })
    }

    await db.init()
    
    // Get user info before deletion for notification
    const user = await db.getDatabaseUserById(dbUserId)
    if (!user) {
      return NextResponse.json({ success: false, error: "Database user not found" }, { status: 404 })
    }

    const success = await db.deleteDatabaseUser(dbUserId)

    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to delete database user" }, { status: 500 })
    }

    // Notify real-time clients
    notifyRealTime('database-user-deleted', { db_user_id: dbUserId, username: user.username }, `Database user ${user.username} deleted`)

    return NextResponse.json({
      success: true,
      message: "Database user deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting database user:", error)
    return NextResponse.json({ success: false, error: "Failed to delete database user" }, { status: 500 })
  }
}
