import { NextRequest, NextResponse } from 'next/server';
import { migrateDb } from '@/db';
import { getUserFromRequest, isSuperAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: 'Access denied. SuperAdmin only.' }, { status: 403 });
    }

    await migrateDb();
    return NextResponse.json({ success: true, message: 'Database migration completed successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

