import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '../../../db';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    // Read auth cookie (should be httpOnly, but fallback to non-httpOnly for dev)
    const cookieStore = await cookies();
    const auth = cookieStore.get('auth')?.value;
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Cookie format: base64(id:username:role)
    let decoded;
    try {
      decoded = Buffer.from(auth, 'base64').toString('utf-8');
    } catch {
      return NextResponse.json({ error: 'Invalid auth cookie' }, { status: 401 });
    }
    const [id] = decoded.split(':');
    const db = await openDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Don't return password hash
    delete user.password;
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
