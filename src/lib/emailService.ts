import nodemailer from 'nodemailer';
import { openDb } from '@/db';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  enabled: boolean;
}

interface AlertData {
  api_name: string;
  api_url: string;
  status: string;
  response_time?: number;
  error_message?: string;
  timestamp: string;
}

export class EmailService {
  private static instance: EmailService;
  private config: EmailConfig | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async loadConfig(userId?: number): Promise<void> {
    try {
      // Load configuration from environment variables
      const config: EmailConfig | null = process.env.SMTP_HOST ? {
        smtp_host: process.env.SMTP_HOST || '',
        smtp_port: parseInt(process.env.SMTP_PORT || '587'),
        smtp_username: process.env.SMTP_USERNAME || '',
        smtp_password: process.env.SMTP_PASSWORD || '',
        from_email: process.env.EMAIL_FROM || '',
        from_name: process.env.EMAIL_FROM_NAME || 'MonitorScope Alerts',
        enabled: process.env.EMAIL_ENABLED === '1',
      } : null;

      this.config = config;
    } catch (error) {
      console.error('Error loading email config:', error);
      this.config = null;
    }
  }

  public async sendAlert(apiId: number, alertData: AlertData, userId?: number): Promise<boolean> {
    if (!this.config && userId) {
      await this.loadConfig(userId);
    }

    if (!this.config || !this.config.enabled) {
      console.log('Email alerts not configured or disabled');
      return false;
    }

    try {
      // Get alert recipients for this API
      const db = await openDb();
      const recipients = await db.all(
        'SELECT email, name FROM alert_recipients WHERE api_id = ? AND enabled = 1',
        apiId
      );
      await db.close();

      if (recipients.length === 0) {
        console.log('No alert recipients configured for API:', apiId);
        return false;
      }

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: this.config.smtp_host,
        port: this.config.smtp_port,
        secure: this.config.smtp_port === 465, // true for 465, false for other ports
        auth: {
          user: this.config.smtp_username,
          pass: this.config.smtp_password,
        },
      });

      // Create email content
      const subject = `🚨 API Alert: ${alertData.api_name} - ${alertData.status}`;
      const html = this.generateAlertEmailHTML(alertData);
      const text = this.generateAlertEmailText(alertData);

      // Send emails to all recipients
      const emailPromises = recipients.map(recipient =>
        transporter.sendMail({
          from: `"${this.config!.from_name}" <${this.config!.from_email}>`,
          to: recipient.email,
          subject,
          text,
          html,
        })
      );

      await Promise.all(emailPromises);
      console.log(`Alert emails sent successfully for API ${apiId} to ${recipients.length} recipients`);
      return true;

    } catch (error) {
      console.error('Error sending alert email:', error);
      return false;
    }
  }

  private generateAlertEmailHTML(alertData: AlertData): string {
    const statusColor = alertData.status === 'UP' ? '#10B981' : '#EF4444';
    const statusIcon = alertData.status === 'UP' ? '✅' : '❌';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>API Alert - ${alertData.api_name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 4px; color: white; font-weight: bold; }
          .status.up { background-color: #10B981; }
          .status.down { background-color: #EF4444; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; }
          .detail-row { margin-bottom: 10px; }
          .detail-label { font-weight: bold; color: #666; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${statusIcon} API Health Alert</h1>
            <p>MonitorScope has detected a change in your API status</p>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">API Name:</span> ${alertData.api_name}
            </div>
            <div class="detail-row">
              <span class="detail-label">URL:</span> ${alertData.api_url}
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="status ${alertData.status.toLowerCase()}">${alertData.status}</span>
            </div>
            ${alertData.response_time ? `
            <div class="detail-row">
              <span class="detail-label">Response Time:</span> ${alertData.response_time}ms
            </div>
            ` : ''}
            ${alertData.error_message ? `
            <div class="detail-row">
              <span class="detail-label">Error Message:</span> ${alertData.error_message}
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="detail-label">Timestamp:</span> ${alertData.timestamp}
            </div>
          </div>

          <div class="footer">
            <p>This alert was sent by MonitorScope API Health Monitoring System.</p>
            <p>To manage your alert settings, please log in to your MonitorScope dashboard.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateAlertEmailText(alertData: AlertData): string {
    const statusIcon = alertData.status === 'UP' ? '✅' : '❌';

    return `
API Health Alert - ${alertData.api_name}

${statusIcon} Status: ${alertData.status}
URL: ${alertData.api_url}
${alertData.response_time ? `Response Time: ${alertData.response_time}ms` : ''}
${alertData.error_message ? `Error: ${alertData.error_message}` : ''}
Timestamp: ${alertData.timestamp}

This alert was sent by MonitorScope API Health Monitoring System.
To manage your alert settings, please log in to your MonitorScope dashboard.
    `.trim();
  }

  public async testEmailConfig(userId?: number): Promise<{ success: boolean; message: string }> {
    if (!this.config && userId) {
      await this.loadConfig(userId);
    }

    if (!this.config) {
      return { success: false, message: 'Email configuration not found' };
    }

    if (!this.config.enabled) {
      return { success: false, message: 'Email alerts are disabled' };
    }

    // Validate required fields
    if (!this.config.smtp_host || !this.config.smtp_username || !this.config.smtp_password || !this.config.from_email) {
      return { success: false, message: 'Missing required email configuration fields' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: this.config.smtp_host,
        port: this.config.smtp_port,
        secure: this.config.smtp_port === 465,
        auth: {
          user: this.config.smtp_username,
          pass: this.config.smtp_password,
        },
      });

      await transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      console.error('Email configuration test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `SMTP connection failed: ${errorMessage}` };
    }
  }
}
