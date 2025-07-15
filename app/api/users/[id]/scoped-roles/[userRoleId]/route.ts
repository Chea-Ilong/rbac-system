import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userRoleId: string }> }
) {
  try {
    const { id, userRoleId } = await params;
    const userId = parseInt(id);
    const roleAssignmentId = parseInt(userRoleId);

    if (isNaN(userId) || isNaN(roleAssignmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID or role assignment ID' },
        { status: 400 }
      );
    }

    await serverDb.revokeScopedRoleFromDatabaseUser(roleAssignmentId);

    return NextResponse.json({
      success: true,
      message: 'Scoped role revoked successfully'
    });

  } catch (error) {
    console.error('Error revoking scoped role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to revoke scoped role' },
      { status: 500 }
    );
  }
}
