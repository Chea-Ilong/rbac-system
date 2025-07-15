import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = parseInt((await params).id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const grants = await serverDb.getUserMySQLGrants(userId);

    return NextResponse.json({
      success: true,
      data: grants
    });

  } catch (error) {
    console.error('Error fetching MySQL grants:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch MySQL grants' },
      { status: 500 }
    );
  }
}
