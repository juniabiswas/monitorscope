import { NextRequest, NextResponse } from 'next/server';
import { AlertService } from '@/lib/alertService';
import { openDb } from '@/db';
import { getUserFromRequest, isAdmin } from '@/lib/auth';

// GET: Get all alerts or alerts for specific API
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const apiId = searchParams.get('api_id');
    const unresolved = searchParams.get('unresolved');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (apiId) {
      // Get alerts for specific API
      const alerts = await AlertService.getAlerts(parseInt(apiId), limit);
      return NextResponse.json(alerts);
    } else if (unresolved === '1') {
      // Get all active alerts
      const alerts = await AlertService.getAllActiveAlerts();
      return NextResponse.json(alerts);
    } else {
      // Get all alerts with stats
      const db = await openDb();
      const alerts = await db.all(`
        SELECT a.*, apis.name as api_name, apis.url as api_url
        FROM alerts a
        JOIN apis ON a.api_id = apis.id
        ORDER BY a.triggered_at DESC
        LIMIT ?
      `, limit);
      await db.close();
      return NextResponse.json(alerts);
    }
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

// POST: Create a new alert
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { api_id, message } = await req.json();

    if (!api_id || !message) {
      return NextResponse.json({ error: 'API ID and message are required' }, { status: 400 });
    }

    const alertId = await AlertService.createOrUpdateAlert(api_id, message);
    return NextResponse.json({ id: alertId, message: 'Alert created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
  }
}

// PUT: Resolve an alert
export async function PUT(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { api_id } = await req.json();

    if (!api_id) {
      return NextResponse.json({ error: 'API ID is required' }, { status: 400 });
    }

    const resolved = await AlertService.resolveAlert(api_id);

    if (resolved) {
      return NextResponse.json({ message: 'Alert resolved successfully' });
    } else {
      return NextResponse.json({ message: 'No active alert found for this API' });
    }
  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
  }
}
