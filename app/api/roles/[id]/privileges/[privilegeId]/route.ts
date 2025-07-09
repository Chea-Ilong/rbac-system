import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/db-server";

// Remove a privilege from a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; privilegeId: string } }
) {
  try {
    const roleId = parseInt(params.id, 10);
    const privilegeId = parseInt(params.privilegeId, 10);

    if (isNaN(roleId) || isNaN(privilegeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid role or privilege ID" },
        { status: 400 }
      );
    }

    const success = await serverDb.removePrivilegeFromRole(roleId, privilegeId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to remove privilege from role" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to remove privilege from role:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove privilege from role" },
      { status: 500 }
    );
  }
}
