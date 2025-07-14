import { type NextRequest, NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

interface RouteParams {
  database: string
}

// GET /api/databases/[database]/tables - Get tables for a specific database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { database } = await params
    
    await serverDb.init()
    const tables = await serverDb.getTablesForDatabase(database)

    return NextResponse.json({
      success: true,
      data: tables,
    })
  } catch (error) {
    console.error("Error fetching tables:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch tables" }, { status: 500 })
  }
}
