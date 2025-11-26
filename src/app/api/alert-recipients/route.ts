import { NextRequest, NextResponse } from 'next/server';
import { openDb } from '@/db';
import { getUserFromRequest, isAdmin } from '@/lib/auth';

// GET: Get alert recipients for an API
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const apiId = searchParams.get('api_id');

    if (!apiId) {
      return NextResponse.json({ error: 'API ID is required' }, { status: 400 });
    }

    const db = await openDb();
    const recipients = await db.all(
      'SELECT * FROM alert_recipients WHERE api_id = ? ORDER BY created_at DESC',
      apiId
    );

    await db.close();
    return NextResponse.json(recipients);
  } catch (error) {
    console.error('Error fetching alert recipients:', error);
    return NextResponse.json({ error: 'Failed to fetch alert recipients' }, { status: 500 });
  }
}

// POST: Add alert recipient for an API
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { api_id, email, name, enabled } = await req.json();

    if (!api_id || !email) {
      return NextResponse.json({ error: 'API ID and email are required' }, { status: 400 });
    }

    const db = await openDb();

    // Check if recipient already exists for this API
    const existing = await db.get(
      'SELECT id FROM alert_recipients WHERE api_id = ? AND email = ?',
      api_id, email
    );

    if (existing) {
      await db.close();
      return NextResponse.json({ error: 'Recipient already exists for this API' }, { status: 400 });
    }

    const result = await db.run(
      'INSERT INTO alert_recipients (api_id, email, name, enabled) VALUES (?, ?, ?, ?)',
      api_id, email, name || '', enabled ? 1 : 0
    );

    const recipient = await db.get('SELECT * FROM alert_recipients WHERE id = ?', result.lastID);
    await db.close();

    return NextResponse.json(recipient, { status: 201 });
  } catch (error) {
    console.error('Error adding alert recipient:', error);
    return NextResponse.json({ error: 'Failed to add alert recipient' }, { status: 500 });
  }
}

// PUT: Update alert recipient
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id, email, name, enabled } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'ID and email are required' }, { status: 400 });
    }

    const db = await openDb();

    await db.run(
      'UPDATE alert_recipients SET email = ?, name = ?, enabled = ? WHERE id = ?',
      email, name || '', enabled ? 1 : 0, id
    );

    const recipient = await db.get('SELECT * FROM alert_recipients WHERE id = ?', id);
    await db.close();

    return NextResponse.json(recipient);
  } catch (error) {
    console.error('Error updating alert recipient:', error);
    return NextResponse.json({ error: 'Failed to update alert recipient' }, { status: 500 });
  }
}

// DELETE: Delete alert recipient
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const db = await openDb();
    await db.run('DELETE FROM alert_recipients WHERE id = ?', id);
    await db.close();

    return NextResponse.json({ success: true, message: 'Alert recipient deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert recipient:', error);
    return NextResponse.json({ error: 'Failed to delete alert recipient' }, { status: 500 });
  }
}
