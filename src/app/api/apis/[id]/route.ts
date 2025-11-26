import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/db";
import { getUserFromRequest, isAdmin } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const db = await openDb();
  const api = await db.get("SELECT * FROM apis WHERE id = ?", id);
  await db.close();
  if (!api) {
    return NextResponse.json({ error: "API not found" }, { status: 404 });
  }

  return NextResponse.json(api);
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const { id, name, url, description, category, environment, expected_response_time, alert_threshold, alert_interval, active, headers } = await req.json();
  if (!id || !name || !url) {
    return NextResponse.json({ error: 'ID, name, and URL are required.' }, { status: 400 });
  }
  const db = await openDb();
  try {
    await db.run(
      `UPDATE apis SET name = ?, url = ?, description = ?, category = ?, environment = ?, expected_response_time = ?, alert_threshold = ?, alert_interval = ?, active = ?, headers = ? WHERE id = ?`,
      name,
      url,
      description ?? '',
      category ?? '',
      environment ?? '',
      expected_response_time ?? null,
      alert_threshold ?? null,
      alert_interval ?? 15,
      active ? 1 : 0,
      headers ?? '',
      id
    );
  } catch (e) {
    await db.close();
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
  const api = await db.get('SELECT * FROM apis WHERE id = ?', id);
  await db.close();
  return NextResponse.json(api);
}
