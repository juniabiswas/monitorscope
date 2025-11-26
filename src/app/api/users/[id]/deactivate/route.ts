import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = await openDb();
  await db.run(`UPDATE users SET status='Inactive' WHERE id=?`, [params.id]);
  await db.close();
  return NextResponse.json({ ok: true });
}
