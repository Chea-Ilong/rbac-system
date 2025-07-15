import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Validate required fields
    if (!config.databases || config.databases.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one database must be selected' },
        { status: 400 }
      );
    }

    if (!config.name) {
      config.name = `backup_${new Date().toISOString().slice(0, 10)}`;
    }

    const result = await serverDb.createBackup(config);
    
    return NextResponse.json({
      success: true,
      backupId: result.backupId
    });

  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create backup' },
      { status: 500 }
    );
  }
}
