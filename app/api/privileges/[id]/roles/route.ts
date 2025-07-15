import { NextRequest, NextResponse } from "next/server";
import { serverDb } from "@/lib/db-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const privilegeId = parseInt((await params).id, 10);
    const roles = await serverDb.getRolesForPrivilege(privilegeId);
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Failed to get roles for privilege:", error);
    return NextResponse.json({ message: "Failed to get roles for privilege" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const privilegeId = parseInt((await params).id, 10);
    const { roleIds } = await request.json();
    await serverDb.assignRolesToPrivilege(privilegeId, roleIds);
    return NextResponse.json({ message: "Roles assigned successfully" });
  } catch (error) {
    console.error("Failed to assign roles to privilege:", error);
    return NextResponse.json({ message: "Failed to assign roles to privilege" }, { status: 500 });
  }
}
