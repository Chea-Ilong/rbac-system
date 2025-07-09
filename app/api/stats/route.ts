import { NextResponse } from "next/server"
import { serverDb } from "@/lib/db-server"

export async function GET() {
  try {
    await serverDb.init()
    const stats = await serverDb.getStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    )
  }
}
