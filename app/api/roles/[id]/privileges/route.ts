import { type NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/db-server";

// Get all privileges for a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roleId = parseInt((await params).id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ message: "Invalid role ID" }, { status: 400 });
    }
    const privileges = await serverDb.getRolePrivileges(roleId);
    return NextResponse.json({ success: true, data: privileges });
  } catch (error) {
    console.error("Failed to get role privileges:", error);
    return NextResponse.json({ success: false, message: "Failed to get role privileges" }, { status: 500 });
  }
}

// Assign privileges to a role atomically
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roleId = parseInt((await params).id, 10);
    if (isNaN(roleId)) {
      return NextResponse.json({ success: false, message: "Invalid role ID" }, { status: 400 });
    }

    const { privilegeIds } = await request.json();

    if (!privilegeIds || !Array.isArray(privilegeIds)) {
      return NextResponse.json({ success: false, message: "privilegeIds must be an array of numbers" }, { status: 400 });
    }

    await serverDb.assignPrivilegesToRole(roleId, privilegeIds);

    return NextResponse.json({ success: true, message: "Privileges assigned successfully" });
  } catch (error) {
    console.error("Failed to assign privileges to role:", error);
    return NextResponse.json({ success: false, message: "Failed to assign privileges to role" }, { status: 500 });
  }
}
