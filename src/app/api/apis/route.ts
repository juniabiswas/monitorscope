import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/db';
import { getUserFromRequest, isAdmin } from '@/lib/auth';

// GET: List all APIs
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const db = await openDb();
  const apis = await db.all('SELECT * FROM apis ORDER BY created_at DESC');
  await db.close();
  return NextResponse.json(apis);
}

// POST: Create a new API
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { name, url, description, category, environment, expected_response_time, alert_threshold, alert_interval, active, headers } = await req.json();
  if (!name || !url) {
    return NextResponse.json({ error: 'Name and URL are required.' }, { status: 400 });
  }
  const db = await openDb();
  const result = await db.run(
    'INSERT INTO apis (name, url, description, category, environment, expected_response_time, alert_threshold, alert_interval, active, headers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    name,
    url,
    description ?? '',
    category ?? '',
    environment ?? '',
    expected_response_time ?? null,
    alert_threshold ?? null,
    alert_interval ?? 15,
    active ? 1 : 0,
    headers ?? ''
  );
  const api = await db.get('SELECT * FROM apis WHERE id = ?', result.lastID);
  await db.close();
  return NextResponse.json(api, { status: 201 });
}

// PUT: Update an API
export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { id, name, url, description, category, environment, expected_response_time, alert_threshold, alert_interval, active, headers } = await req.json();
  if (!id || !name || !url) {
    return NextResponse.json({ error: 'ID, name, and URL are required.' }, { status: 400 });
  }
  const db = await openDb();
  await db.run(
    'UPDATE apis SET name = ?, url = ?, description = ?, category = ?, environment = ?, expected_response_time = ?, alert_threshold = ?, alert_interval = ?, active = ?, headers = ? WHERE id = ?',
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
  const api = await db.get('SELECT * FROM apis WHERE id = ?', id);
  await db.close();
  return NextResponse.json(api);
}

// DELETE: Delete an API
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
  }
  const db = await openDb();
  await db.run('DELETE FROM apis WHERE id = ?', id);
  await db.close();
  return NextResponse.json({ success: true });
}
