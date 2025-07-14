import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database-config"
import { RowDataPacket } from 'mysql2'

interface RouteParams {
  database: string
}

// GET /api/discover/databases/[database]/tables - Discover all tables in a specific database
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  try {
    const { database } = await params
    
    // Get all tables for the specified database
    const [tableRows] = await pool.execute<RowDataPacket[]>(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_TYPE as table_type,
        ENGINE as engine,
        TABLE_ROWS as row_count,
        DATA_LENGTH as data_length,
        CREATE_TIME as created_at,
        TABLE_COMMENT as comment
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [database])

    const tables = tableRows.map(row => ({
      database_name: database,
      table_name: row.table_name,
      table_type: row.table_type,
      engine: row.engine,
      row_count: row.row_count || 0,
      data_length: row.data_length || 0,
      created_at: row.created_at,
      comment: row.comment,
      type: 'discovered'
    }))

    return NextResponse.json({
      success: true,
      data: tables,
    })
  } catch (error) {
    console.error("Error discovering tables:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to discover tables" 
    }, { status: 500 })
  }
}
