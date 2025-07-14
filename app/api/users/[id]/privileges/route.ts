import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

interface RouteParams {
  id: string
}

// GET /api/users/[id]/privileges - Get user's specific privileges
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    await serverDb.init()
    const privileges = await serverDb.getUserEffectivePrivileges(userId)

    return NextResponse.json({
      success: true,
      data: privileges,
    })
  } catch (error) {
    console.error("Error fetching user privileges:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user privileges" }, { status: 500 })
  }
}

// POST /api/users/[id]/privileges - Grant specific privilege to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    const body = await request.json()
    const { privilegeType, targetDatabase, targetTable, grantedBy } = body

    if (!privilegeType || !targetDatabase) {
      return NextResponse.json({ 
        success: false, 
        error: "Privilege type and target database are required" 
      }, { status: 400 })
    }

    await serverDb.init()
    const privilege = await serverDb.grantUserSpecificPrivilege({
      userId,
      privilegeType,
      targetDatabase,
      targetTable,
      grantedBy
    })

    console.log(`Real-time event: privilege-granted`, { userId, privilege });
    console.log(`Notification: Granted ${privilegeType} on ${targetDatabase}${targetTable ? `.${targetTable}` : ''} to user ${userId}`);

    return NextResponse.json({
      success: true,
      data: privilege,
      message: "Privilege granted successfully",
    })
  } catch (error) {
    console.error("Error granting privilege:", error)
    
    if (error instanceof Error && error.message.includes("Duplicate entry")) {
      return NextResponse.json({ success: false, error: "Privilege already granted" }, { status: 409 })
    }

    return NextResponse.json({ success: false, error: "Failed to grant privilege" }, { status: 500 })
  }
}
