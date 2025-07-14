import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

// GET /api/databases - Get all available databases
export async function GET() {
  try {
    await serverDb.init()
    const databases = await serverDb.getDatabases()

    return NextResponse.json({
      success: true,
      data: databases,
    })
  } catch (error) {
    console.error("Error fetching databases:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch databases" }, { status: 500 })
  }
}
