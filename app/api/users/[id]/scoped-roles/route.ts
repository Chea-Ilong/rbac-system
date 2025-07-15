import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/db-server';

export async function POST(
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

    const body = await request.json();
    const { roleId, scopeType, targetDatabase, targetTable, assignedBy } = body;

    if (!roleId || !scopeType) {
      return NextResponse.json(
        { success: false, error: 'Role ID and scope type are required' },
        { status: 400 }
      );
    }

    if (scopeType === 'DATABASE' && !targetDatabase) {
      return NextResponse.json(
        { success: false, error: 'Target database is required for DATABASE scope' },
        { status: 400 }
      );
    }

    if (scopeType === 'TABLE' && (!targetDatabase || !targetTable)) {
      return NextResponse.json(
        { success: false, error: 'Target database and table are required for TABLE scope' },
        { status: 400 }
      );
    }

    const assignment = await serverDb.assignScopedRoleToDatabaseUser({
      dbUserId: userId,
      roleId,
      scopeType,
      targetDatabase,
      targetTable,
      assignedBy: assignedBy || 'admin'
    });

    // Apply privileges for this scoped role assignment
    await serverDb.applyScopedRolePrivileges(
      userId, 
      roleId, 
      scopeType, 
      targetDatabase, 
      targetTable
    );

    return NextResponse.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Error assigning scoped role:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to assign scoped role' },
      { status: 500 }
    );
  }
}

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

    const assignments = await serverDb.getUserScopedRoles(userId);

    return NextResponse.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching user scoped roles:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch scoped roles' },
      { status: 500 }
    );
  }
}
