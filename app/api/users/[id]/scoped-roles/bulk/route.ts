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
    const { roleId, scopeType, targetDatabase, targetTables, assignedBy } = body;

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

    if (scopeType === 'TABLE' && (!targetDatabase || !targetTables || !Array.isArray(targetTables) || targetTables.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Target database and tables array are required for TABLE scope bulk assignment' },
        { status: 400 }
      );
    }

    // Handle bulk table assignments
    if (scopeType === 'TABLE' && targetTables && Array.isArray(targetTables)) {
      const assignments = [];
      const errors = [];

      for (const targetTable of targetTables) {
        try {
          const assignment = await serverDb.assignScopedRoleToDatabaseUser({
            dbUserId: userId,
            roleId,
            scopeType: 'TABLE',
            targetDatabase,
            targetTable,
            assignedBy: assignedBy || 'admin'
          });

          // Apply privileges for this scoped role assignment
          await serverDb.applyScopedRolePrivileges(
            userId, 
            roleId, 
            'TABLE', 
            targetDatabase, 
            targetTable
          );

          assignments.push(assignment);
        } catch (error) {
          console.error(`Error assigning role to table ${targetTable}:`, error);
          errors.push({
            table: targetTable,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          assignments,
          errors,
          totalRequested: targetTables.length,
          successfulAssignments: assignments.length,
          failedAssignments: errors.length
        }
      });
    }

    // Handle single assignment (fallback for non-bulk)
    const assignment = await serverDb.assignScopedRoleToDatabaseUser({
      dbUserId: userId,
      roleId,
      scopeType,
      targetDatabase,
      targetTable: undefined,
      assignedBy: assignedBy || 'admin'
    });

    // Apply privileges for this scoped role assignment
    await serverDb.applyScopedRolePrivileges(
      userId, 
      roleId, 
      scopeType, 
      targetDatabase, 
      undefined
    );

    return NextResponse.json({
      success: true,
      data: assignment
    });

  } catch (error) {
    console.error('Error in bulk scoped role assignment:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to assign scoped roles' },
      { status: 500 }
    );
  }
}
