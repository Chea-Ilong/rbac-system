import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

interface RouteParams {
  id: string
  privilegeId: string
}

// DELETE /api/users/[id]/privileges/[privilegeId] - Revoke specific privilege from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { id, privilegeId } = await params
    const userId = parseInt(id)
    const privId = parseInt(privilegeId)

    if (isNaN(userId) || isNaN(privId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID or privilege ID" }, { status: 400 })
    }

    await serverDb.init()
    await serverDb.revokeUserSpecificPrivilege(userId, privId)

    console.log(`Real-time event: privilege-revoked`, { userId, privilegeId: privId });
    console.log(`Notification: Revoked privilege ${privId} from user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Privilege revoked successfully",
    })
  } catch (error) {
    console.error("Error revoking privilege:", error)
    return NextResponse.json({ success: false, error: "Failed to revoke privilege" }, { status: 500 })
  }
}
