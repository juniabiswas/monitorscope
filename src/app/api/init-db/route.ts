import { NextRequest, NextResponse } from 'next/server';
import { initDb } from '@/db';
import { getUserFromRequest, isSuperAdmin } from '@/lib/auth';

// API route to initialize the database (for development/demo)
// DANGER: This endpoint can wipe your database. Only SuperAdmin can access.
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Access denied. SuperAdmin only.' }, { status: 403 });
    }

    await initDb();
    return NextResponse.json({ success: true, message: 'Database initialized.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
