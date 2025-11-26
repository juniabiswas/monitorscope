import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db";
import { getUserFromRequest, canAccessUserManagement, isSuperAdmin } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(req);
  if (!user || !canAccessUserManagement(user)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const data = await req.json();
  const db = await openDb();

  // Get the existing user to check current role and password
  const existingUser = await db.get("SELECT role, password FROM users WHERE id=?", [params.id]);
  if (!existingUser) {
    await db.close();
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent role changes unless user is SuperAdmin
  if (data.role && data.role !== existingUser.role && !isSuperAdmin(user)) {
    await db.close();
    return NextResponse.json({ error: "Only SuperAdmin can change user roles" }, { status: 403 });
  }

  // Prevent users from modifying themselves
  if (parseInt(params.id) === user.id) {
    await db.close();
    return NextResponse.json({ error: "Cannot modify your own account through this endpoint" }, { status: 403 });
  }

  // Hash the password if it's being updated
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : existingUser.password;

  await db.run(
    `UPDATE users SET username=?, password=?, full_name=?, email=?, organization=?, role=?, phone=?, status=? WHERE id=?`,
    [
      data.username,
      hashedPassword,
      data.full_name,
      data.email,
      data.organization,
      data.role,
      data.phone,
      data.status,
      params.id,
    ]
  );
  await db.close();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUserFromRequest(req);
  if (!user || !canAccessUserManagement(user)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Prevent users from deleting themselves
  if (parseInt(params.id) === user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 403 });
  }

  const db = await openDb();
  await db.run(`DELETE FROM users WHERE id=?`, [params.id]);
  await db.close();
  return NextResponse.json({ ok: true });
}
