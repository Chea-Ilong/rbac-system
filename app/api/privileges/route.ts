import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

// GET /api/privileges - Get all privileges
export async function GET() {
  try {
    await serverDb.init()
    const privileges = await serverDb.getPrivileges()

    return NextResponse.json({
      success: true,
      data: privileges,
    })
  } catch (error) {
    console.error("Error fetching privileges:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch privileges" }, { status: 500 })
  }
}

// POST /api/privileges - Create new privilege
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    await serverDb.init()

    // Create new privilege
    const newPrivilege = await serverDb.createPrivilege({
      name: name.trim(),
      description: description?.trim() || '',
    })

    console.log(`Real-time event: created`, newPrivilege);
    console.log(`Notification: New privilege "${newPrivilege.name}" has been created`);

    return NextResponse.json({
      success: true,
      data: newPrivilege,
      message: "Privilege created successfully",
    })
  } catch (error) {
    console.error("Error creating privilege:", error)

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    return NextResponse.json({ success: false, error: "Failed to create privilege" }, { status: 500 })
  }
}
