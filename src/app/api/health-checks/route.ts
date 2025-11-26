import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/db';
import { getUserFromRequest, isAdmin } from '@/lib/auth';

// GET: List all health checks (optionally filter by api_id)
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const apiId = req.nextUrl.searchParams.get('api_id');
  const db = await openDb();
  let healthChecks;
  if (apiId) {
    healthChecks = await db.all('SELECT * FROM health_checks WHERE api_id = ? ORDER BY checked_at DESC', apiId);
  } else {
    healthChecks = await db.all('SELECT * FROM health_checks ORDER BY checked_at DESC');
  }
  await db.close();
  return NextResponse.json(healthChecks);
}

// POST: Create a new health check record
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { api_id, status, response_time } = await req.json();
  if (!api_id || !status) {
    return NextResponse.json({ error: 'api_id and status are required.' }, { status: 400 });
  }
  const db = await openDb();
  const result = await db.run(
    'INSERT INTO health_checks (api_id, status, response_time) VALUES (?, ?, ?)',
    api_id, status, response_time || null
  );
  const healthCheck = await db.get('SELECT * FROM health_checks WHERE id = ?', result.lastID);
  await db.close();
  return NextResponse.json(healthCheck, { status: 201 });
}
