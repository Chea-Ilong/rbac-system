import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const backupId = (await params).id;
    
    await serverDb.deleteBackup(backupId);
    
    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete backup' },
      { status: 500 }
    );
  }
}
