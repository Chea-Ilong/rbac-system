import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

// GET /api/users/[id]/roles - Get database user roles
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUserId = Number.parseInt(params.id)

    if (isNaN(dbUserId)) {
      return NextResponse.json({ success: false, error: "Invalid database user ID" }, { status: 400 })
    }

    await serverDb.init()
    const userRoles = await serverDb.getDatabaseUserRoles(dbUserId)

    return NextResponse.json({
      success: true,
      data: userRoles,
    })
  } catch (error) {
    console.error("Error fetching database user roles:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch database user roles" }, { status: 500 })
  }
}

// POST /api/users/[id]/roles - Assign roles to database user
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbUserId = Number.parseInt(params.id)
    const body = await request.json()

    if (isNaN(dbUserId)) {
      return NextResponse.json({ success: false, error: "Invalid database user ID" }, { status: 400 })
    }

    await serverDb.init()

    // Handle both single role and multiple roles assignment
    if (body.roleId) {
      // Single role assignment
      await serverDb.assignRoleToDatabaseUser(dbUserId, body.roleId)
    } else if (body.roleIds && Array.isArray(body.roleIds)) {
      // Multiple roles assignment (replace all)
      await serverDb.assignRolesToDatabaseUser(dbUserId, body.roleIds)
    } else {
      return NextResponse.json({ success: false, error: "roleId or roleIds required" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Roles assigned successfully",
    })
  } catch (error) {
    console.error("Error assigning roles to database user:", error)
    return NextResponse.json({ success: false, error: "Failed to assign roles to database user" }, { status: 500 })
  }
}
