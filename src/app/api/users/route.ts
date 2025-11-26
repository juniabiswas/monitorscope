import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db";
import { getUserFromRequest, canAccessUserManagement } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || !canAccessUserManagement(user)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const db = await openDb();
  const users = await db.all("SELECT id, username, full_name, email, organization, role, phone, status, created_at FROM users");
  await db.close();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || !canAccessUserManagement(user)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const data = await req.json();

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const db = await openDb();
  const result = await db.run(
    `INSERT INTO users (username, password, full_name, email, organization, role, phone, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.username,
      hashedPassword,
      data.full_name,
      data.email,
      data.organization,
      data.role,
      data.phone,
      data.status,
    ]
  );
  await db.close();
  return NextResponse.json({ id: result.lastID });
}
