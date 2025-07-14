import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database-config'

export async function POST(request: NextRequest) {
  try {
    // Mark existing scoped role assignments as inactive for heang
    await pool.execute(`
      UPDATE DatabaseUserRoles 
      SET is_active = FALSE 
      WHERE db_user_id = (SELECT db_user_id FROM DatabaseUsers WHERE username = 'heang' LIMIT 1)
    `);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully deactivated existing scoped role assignments for heang'
    });
    
  } catch (error: any) {
    console.error('Error deactivating assignments:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to deactivate assignments'
    }, { status: 500 });
  }
}
