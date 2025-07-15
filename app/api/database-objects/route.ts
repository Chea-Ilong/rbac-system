import { NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

// GET /api/database-objects - Get all database objects (databases and tables)
export async function GET(request: NextRequest) {
  try {
    const objects = await serverDb.getDatabaseObjects()

    return NextResponse.json({
      success: true,
      data: objects,
    })
  } catch (error) {
    console.error("Error fetching database objects:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch database objects" 
    }, { status: 500 })
  }
}
