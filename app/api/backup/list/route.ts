import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function GET() {
  try {
    const backups = await serverDb.getBackups();
    
    return NextResponse.json({
      success: true,
      data: backups
    });

  } catch (error) {
    console.error('Error fetching backups:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch backups' },
      { status: 500 }
    );
  }
}
