import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';
import { pool } from '@/lib/database-config';
import { readFileSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const backupId = (await params).id;
    
    // Get backup info
    const [backups] = await pool.execute(
      'SELECT file_path, name FROM BackupJobs WHERE id = ? AND status = "completed"',
      [backupId]
    );

    if (!backups || (backups as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Backup not found or not completed' },
        { status: 404 }
      );
    }

    const backup = (backups as any[])[0];
    
    if (!backup.file_path) {
      return NextResponse.json(
        { success: false, error: 'Backup file not found' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = readFileSync(backup.file_path);
    
    // Determine content type
    const isCompressed = backup.file_path.endsWith('.gz');
    const contentType = isCompressed ? 'application/gzip' : 'application/sql';
    const filename = `${backup.name}${isCompressed ? '.sql.gz' : '.sql'}`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to download backup' },
      { status: 500 }
    );
  }
}
