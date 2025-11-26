import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/emailService';
import { getUserFromRequest, canAccessEmailSettings } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || !canAccessEmailSettings(user)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { test_email } = await req.json();

    if (!test_email) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 });
    }

    const emailService = EmailService.getInstance();
    await emailService.loadConfig(user.id);

    // Test the email configuration
    const configTest = await emailService.testEmailConfig(user.id);

    if (!configTest.success) {
      return NextResponse.json({
        success: false,
        message: configTest.message
      }, { status: 400 });
    }

    // Send a test email
    const testAlertData = {
      api_name: 'Test API',
      api_url: 'https://api.example.com/test',
      status: 'DOWN',
      response_time: 5000,
      error_message: 'This is a test alert email',
      timestamp: new Date().toISOString()
    };

    // Temporarily add the test email as a recipient
    const db = await import('@/db').then(m => m.openDb());
    const result = await db.run(
      'INSERT INTO alert_recipients (api_id, email, name, enabled) VALUES (?, ?, ?, ?)',
      1, test_email, 'Test Recipient', 1
    );

    const success = await emailService.sendAlert(1, testAlertData);

    // Clean up test recipient
    await db.run('DELETE FROM alert_recipients WHERE id = ?', result.lastID);
    await db.close();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test email'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send test email'
    }, { status: 500 });
  }
}
