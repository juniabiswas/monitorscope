import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canAccessEmailSettings } from '@/lib/auth';

// GET: Get email configuration from environment variables
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !canAccessEmailSettings(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Return configuration from environment variables
    // Don't return the actual password for security
    const config = {
      smtp_host: process.env.SMTP_HOST || '',
      smtp_port: parseInt(process.env.SMTP_PORT || '587'),
      smtp_username: process.env.SMTP_USERNAME || '',
      smtp_password: '********', // Don't expose actual password
      from_email: process.env.EMAIL_FROM || '',
      from_name: process.env.EMAIL_FROM_NAME || '',
      enabled: process.env.EMAIL_ENABLED === '1'
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching email config:', error);
    return NextResponse.json({ error: 'Failed to fetch email configuration' }, { status: 500 });
  }
}

// POST: Inform user that configuration is managed via .env file
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !canAccessEmailSettings(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      error: 'Email configuration is managed via environment variables. Please update the .env file to change email settings.'
    }, { status: 400 });
  } catch (error) {
    console.error('Error saving email config:', error);
    return NextResponse.json({ error: 'Failed to save email configuration' }, { status: 500 });
  }
}

// DELETE: Inform user that configuration is managed via .env file
export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !canAccessEmailSettings(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      error: 'Email configuration is managed via environment variables. Please update the .env file to change email settings.'
    }, { status: 400 });
  } catch (error) {
    console.error('Error deleting email config:', error);
    return NextResponse.json({ error: 'Failed to delete email configuration' }, { status: 500 });
  }
}
