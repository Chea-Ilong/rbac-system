import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

// GET /api/roles - Get all roles
export async function GET() {
  try {
    await serverDb.init()
    const roles = await serverDb.getRoles()

    return NextResponse.json({
      success: true,
      data: roles,
    })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch roles" }, { status: 500 })
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    await serverDb.init()

    // Create new role
    const newRole = await serverDb.createRole({
      name: name.trim(),
      description: description?.trim() || '',
    })

    console.log(`Real-time event: created`, newRole);
    console.log(`Notification: New role "${newRole.name}" has been created`);

    return NextResponse.json({
      success: true,
      data: newRole,
      message: "Role created successfully",
    })
  } catch (error) {
    console.error("Error creating role:", error)

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    return NextResponse.json({ success: false, error: "Failed to create role" }, { status: 500 })
  }
}
