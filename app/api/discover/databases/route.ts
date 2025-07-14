import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database-config"
import { RowDataPacket } from 'mysql2'

// GET /api/discover/databases - Discover all databases on the MariaDB server
export async function GET() {
  try {
    // Get all databases (excluding system databases by default)
    const [databaseRows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        SCHEMA_NAME as database_name,
        DEFAULT_CHARACTER_SET_NAME as charset,
        DEFAULT_COLLATION_NAME as collation
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
      ORDER BY SCHEMA_NAME
    `)

    const databases = databaseRows.map(row => ({
      database_name: row.database_name,
      charset: row.charset,
      collation: row.collation,
      type: 'discovered'
    }))

    return NextResponse.json({
      success: true,
      data: databases,
    })
  } catch (error) {
    console.error("Error discovering databases:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to discover databases" 
    }, { status: 500 })
  }
}
