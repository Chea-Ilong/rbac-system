import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

// GET /api/roles/[id] - Get role by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roleId = Number.parseInt(id)

    if (isNaN(roleId)) {
      return NextResponse.json({ success: false, error: "Invalid role ID" }, { status: 400 })
    }

    await serverDb.init()
    const role = await serverDb.getRoleById(roleId)

    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: role,
    })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch role" }, { status: 500 })
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roleId = Number.parseInt(id)
    const body = await request.json()
    const { name, description } = body

    if (isNaN(roleId)) {
      return NextResponse.json({ success: false, error: "Invalid role ID" }, { status: 400 })
    }

    await serverDb.init()
    const updatedRole = await serverDb.updateRole(roleId, { name, description })

    if (!updatedRole) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: "Role updated successfully",
    })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ success: false, error: "Failed to update role" }, { status: 500 })
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roleId = Number.parseInt(id)

    if (isNaN(roleId)) {
      return NextResponse.json({ success: false, error: "Invalid role ID" }, { status: 400 })
    }

    await serverDb.init()
    const deleted = await serverDb.deleteRole(roleId)

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ success: false, error: "Failed to delete role" }, { status: 500 })
  }
}
