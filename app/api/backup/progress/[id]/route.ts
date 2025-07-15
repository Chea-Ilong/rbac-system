import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const backupId = (await params).id;
    
    const progress = await serverDb.getBackupProgress(backupId);
    
    return NextResponse.json({
      success: true,
      ...progress
    });

  } catch (error) {
    console.error('Error fetching backup progress:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch backup progress' },
      { status: 500 }
    );
  }
}
