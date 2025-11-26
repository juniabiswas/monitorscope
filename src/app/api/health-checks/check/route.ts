import { NextRequest, NextResponse } from 'next/server';
import { HealthCheckService } from '@/lib/healthCheckService';
import { getUserFromRequest, isAdmin } from '@/lib/auth';

// POST: Trigger health check for specific API or all APIs
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { api_id } = await req.json();
    const healthCheckService = HealthCheckService.getInstance();

    if (api_id) {
      // Check specific API
      const result = await healthCheckService.performHealthCheck(api_id);
      return NextResponse.json({
        success: true,
        message: `Health check completed for API ${api_id}`,
        result
      });
    } else {
      // Check all APIs
      await healthCheckService.checkAllApis();
      return NextResponse.json({
        success: true,
        message: 'Health checks completed for all active APIs'
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to perform health check'
    }, { status: 500 });
  }
}
