import { NextResponse } from "next/server";
import { openDb } from "@/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
  }
  const db = await openDb();
  const user = await db.get("SELECT * FROM users WHERE username = ? AND status = 'Active'", username);
  if (!user) {
    await db.close();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  // Use bcrypt for secure password comparison
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await db.close();
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  await db.close();
  // Set secure session cookie
  const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
  res.cookies.set("auth", Buffer.from(`${user.id}:${user.username}:${user.role}`).toString("base64"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  return res;
}

export async function GET() {
  // For checking session
  return NextResponse.json({ ok: true });
}
