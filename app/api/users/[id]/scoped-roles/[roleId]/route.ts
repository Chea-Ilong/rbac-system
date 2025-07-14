import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; roleId: string } }
) {
  try {
    const userId = parseInt(params.id);
    const userRoleId = parseInt(params.roleId);
    
    if (isNaN(userId) || isNaN(userRoleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID or role assignment ID' },
        { status: 400 }
      );
    }

    await serverDb.revokeScopedRoleFromDatabaseUser(userRoleId);

    return NextResponse.json({
      success: true,
      message: 'Scoped role successfully revoked'
    });

  } catch (error) {
    console.error('Error revoking scoped role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to revoke scoped role' },
      { status: 500 }
    );
  }
}
