import { type NextRequest, NextResponse } from "next/server"
import { serverDb as db } from "@/lib/db-server"

// Simple notification function (real-time service will be imported if running)
function notifyRealTime(eventType: string, data: any, message?: string) {
  // This will be handled by the WebSocket server
  // For now, we'll just log the event
  console.log(`Real-time event: ${eventType}`, data);
  if (message) console.log(`Notification: ${message}`);
}

// GET /api/users - Get all database users
export async function GET() {
  try {
    await db.init()
    const dbUsers = await db.getDatabaseUsers()

    return NextResponse.json({
      success: true,
      data: dbUsers,
    })
  } catch (error) {
    console.error("Error fetching database users:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch database users" }, { status: 500 })
  }
}

// POST /api/users - Create new database user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, host, description, password } = body

    // Validate required fields
    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required" }, { status: 400 })
    }

    // Validate username format (MySQL username restrictions)
    if (username.length > 32) {
      return NextResponse.json({ success: false, error: "Username cannot exceed 32 characters" }, { status: 400 })
    }

    await db.init()

    // Create new database user
    const newUser = await db.createDatabaseUser({
      username: username.trim(),
      host: host || '%',
      description: description || '',
      password: password || undefined
    })

    // Notify real-time clients
    notifyRealTime('database-user-created', newUser, `Database user ${username} created`)

    return NextResponse.json({
      success: true,
      data: newUser,
    })
  } catch (error) {
    console.error("Error creating database user:", error)
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 })
      }
    }
    
    return NextResponse.json({ success: false, error: "Failed to create database user" }, { status: 500 })
  }
}
