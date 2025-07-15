import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

// GET /api/privileges/[id] - Get privilege by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const privilegeId = Number.parseInt(id)

    if (isNaN(privilegeId)) {
      return NextResponse.json({ success: false, error: "Invalid privilege ID" }, { status: 400 })
    }

    await serverDb.init()
    const privilege = await serverDb.getPrivilegeById(privilegeId)

    if (!privilege) {
      return NextResponse.json({ success: false, error: "Privilege not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: privilege,
    })
  } catch (error) {
    console.error("Error fetching privilege:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch privilege" }, { status: 500 })
  }
}

// PUT /api/privileges/[id] - Update privilege by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const privilegeId = Number.parseInt(id)
    if (isNaN(privilegeId)) {
      return NextResponse.json({ success: false, error: "Invalid privilege ID" }, { status: 400 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: "Privilege name is required" }, { status: 400 })
    }

    await serverDb.init()
    const updatedPrivilege = await serverDb.updatePrivilege(privilegeId, { name, description })

    if (!updatedPrivilege) {
      return NextResponse.json({ success: false, error: "Privilege not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updatedPrivilege })
  } catch (error) {
    console.error("Error updating privilege:", error)
    return NextResponse.json({ success: false, error: "Failed to update privilege" }, { status: 500 })
  }
}

// DELETE /api/privileges/[id] - Delete privilege by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const privilegeId = Number.parseInt(id)
    if (isNaN(privilegeId)) {
      return NextResponse.json({ success: false, error: "Invalid privilege ID" }, { status: 400 })
    }

    await serverDb.init()
    const success = await serverDb.deletePrivilege(privilegeId)

    if (!success) {
      return NextResponse.json({ success: false, error: "Privilege not found or could not be deleted" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting privilege:", error)
    return NextResponse.json({ success: false, error: "Failed to delete privilege" }, { status: 500 })
  }
}
