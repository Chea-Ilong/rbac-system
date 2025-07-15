import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

interface RouteParams {
  id: string
}

// GET /api/users/[id]/effective-privileges - Get user's effective privileges (from roles + direct grants)
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
    const effectivePrivileges = await serverDb.getUserEffectivePrivileges(userId)

    return NextResponse.json({
      success: true,
      data: effectivePrivileges,
    })
  } catch (error) {
    console.error("Error fetching user effective privileges:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user effective privileges" }, { status: 500 })
  }
}
