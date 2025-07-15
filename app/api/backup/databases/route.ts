import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function GET() {
  try {
    // Get all databases with their table information
    const databases = await serverDb.getBackupDatabaseInfo();
    
    return NextResponse.json({
      success: true,
      data: databases
    });

  } catch (error) {
    console.error('Error fetching database info for backup:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch database info' },
      { status: 500 }
    );
  }
}
