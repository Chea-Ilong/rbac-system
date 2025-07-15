import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Validate required fields
    if (!config.backupId) {
      return NextResponse.json(
        { success: false, error: 'Backup ID is required' },
        { status: 400 }
      );
    }

    await serverDb.restoreBackup(config);
    
    return NextResponse.json({
      success: true,
      message: 'Database restored successfully'
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to restore backup' },
      { status: 500 }
    );
  }
}
