#!/usr/bin/env node
// cron-ping.js
// Enhanced script to ping all APIs and send email alerts

// Load environment variables from .env file
require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

const db = new sqlite3.Database('./data/healthcheck.db');

// Email configuration (will be loaded from environment variables)
let emailConfig = null;

function getApis() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM apis WHERE active = 1', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getEmailConfig() {
  // Load configuration from environment variables
  if (!process.env.SMTP_HOST || process.env.EMAIL_ENABLED !== '1') {
    return null;
  }

  return {
    smtp_host: process.env.SMTP_HOST,
    smtp_port: parseInt(process.env.SMTP_PORT || '587'),
    smtp_username: process.env.SMTP_USERNAME,
    smtp_password: process.env.SMTP_PASSWORD,
    from_email: process.env.EMAIL_FROM,
    from_name: process.env.EMAIL_FROM_NAME || 'MonitorScope Alerts',
    enabled: true
  };
}

function getAlertRecipients(apiId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT email, name FROM alert_recipients WHERE api_id = ? AND enabled = 1', [apiId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function insertHealthCheck(api_id, status, response_time) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO health_checks (api_id, status, response_time) VALUES (?, ?, ?)',
      [api_id, status, response_time],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function createOrUpdateAlert(api_id, message) {
  return new Promise((resolve, reject) => {
    // Check if there's an active alert for this API
    db.get('SELECT id FROM alerts WHERE api_id = ? AND status = "active"', [api_id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        // Update existing alert
        db.run(
          'UPDATE alerts SET message = ?, alert_count = alert_count + 1, last_alert_sent = CURRENT_TIMESTAMP WHERE id = ?',
          [message, row.id],
          function (err) {
            if (err) reject(err);
            else resolve(row.id);
          }
        );
      } else {
        // Create new alert
        db.run(
          'INSERT INTO alerts (api_id, message, status, last_alert_sent) VALUES (?, ?, "active", CURRENT_TIMESTAMP)',
          [api_id, message],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      }
    });
  });
}

function resolveAlert(api_id) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE alerts SET status = "resolved", resolved_at = CURRENT_TIMESTAMP WHERE api_id = ? AND status = "active"',
      [api_id],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      }
    );
  });
}

function shouldSendAlert(api_id, alert_interval_minutes) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT last_alert_sent FROM alerts WHERE api_id = ? AND status = "active" ORDER BY triggered_at DESC LIMIT 1',
      [api_id],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row || !row.last_alert_sent) {
          resolve(true); // No previous alert, send immediately
          return;
        }

        const lastAlertTime = new Date(row.last_alert_sent);
        const now = new Date();
        const minutesSinceLastAlert = (now.getTime() - lastAlertTime.getTime()) / (1000 * 60);

        resolve(minutesSinceLastAlert >= alert_interval_minutes);
      }
    );
  });
}

async function sendAlert(api, status, response_time, error_message) {
  if (!emailConfig) return;

  try {
    const recipients = await getAlertRecipients(api.id);
    if (recipients.length === 0) return;

    const transporter = nodemailer.createTransport({
      host: emailConfig.smtp_host,
      port: emailConfig.smtp_port,
      secure: emailConfig.smtp_port === 465,
      auth: {
        user: emailConfig.smtp_username,
        pass: emailConfig.smtp_password,
      },
    });

    const alertData = {
      api_name: api.name,
      api_url: api.url,
      status: status,
      response_time: response_time,
      error_message: error_message,
      timestamp: new Date().toISOString()
    };

    const subject = `🚨 API Alert: ${api.name} - ${status}`;
    const html = generateAlertEmailHTML(alertData);
    const text = generateAlertEmailText(alertData);

    // Send emails to all recipients
    for (const recipient of recipients) {
      await transporter.sendMail({
        from: `"${emailConfig.from_name}" <${emailConfig.from_email}>`,
        to: recipient.email,
        subject,
        text,
        html,
      });
    }

    console.log(`📧 Alert emails sent for API ${api.name} to ${recipients.length} recipients`);
  } catch (error) {
    console.error('Failed to send alert email:', error);
  }
}

function generateAlertEmailHTML(alertData) {
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

function generateAlertEmailText(alertData) {
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

async function checkApiHealth(api) {
  const start = Date.now();
  let status = 'DOWN';
  let response_time = null;
  let error_message = null;

  try {
    // Parse headers if provided
    let headers = {};
    if (api.headers) {
      try {
        headers = JSON.parse(api.headers);
      } catch (e) {
        console.warn(`Invalid headers JSON for API ${api.id}:`, e.message);
      }
    }

    // Add default headers
    const requestHeaders = {
      'User-Agent': 'MonitorScope/1.0',
      'Accept': 'application/json',
      'Connection': 'close',
      ...headers
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(api.url, {
      method: 'GET',
      headers: requestHeaders,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    response_time = Date.now() - start;

    // Check if response is successful
    if (response.ok) {
      // Check response time threshold if configured
      if (api.alert_threshold && response_time > api.alert_threshold) {
        status = 'DOWN';
        error_message = `Response time ${response_time}ms exceeds threshold of ${api.alert_threshold}ms`;
      } else {
        status = 'UP';
      }
    } else {
      status = 'DOWN';
      error_message = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    response_time = Date.now() - start;
    status = 'DOWN';

    if (error.name === 'AbortError') {
      error_message = 'Request timeout (30s)';
    } else {
      error_message = error.message;
    }
  }

  return { status, response_time, error_message };
}

async function pingApis() {
  console.log(`[${new Date().toISOString()}] Starting health check cycle...`);

  try {
    // Load email configuration from environment variables
    emailConfig = getEmailConfig();
    if (emailConfig) {
      console.log('📧 Email alerts enabled');
    } else {
      console.log('📧 Email alerts disabled (no configuration found)');
    }

    const apis = await getApis();
    console.log(`🔍 Checking ${apis.length} active APIs...`);

    for (const api of apis) {
      const result = await checkApiHealth(api);

      // Save health check result
      await insertHealthCheck(api.id, result.status, result.response_time);

      if (result.status === 'DOWN') {
        // API is down - create or update alert
        const alertMessage = `API ${api.name} is DOWN: ${result.error_message || 'Unknown error'}`;
        await createOrUpdateAlert(api.id, alertMessage);

        // Check if we should send alert based on interval
        const alertInterval = api.alert_interval || 15; // Default 15 minutes
        const shouldSend = await shouldSendAlert(api.id, alertInterval);

        if (shouldSend) {
          await sendAlert(api, result.status, result.response_time, result.error_message);
          console.log(`🚨 Alert sent for ${api.name} (interval: ${alertInterval}min)`);
        } else {
          console.log(`⏰ Alert skipped for ${api.name} (interval: ${alertInterval}min)`);
        }
      } else {
        // API is up - resolve any active alerts
        const resolved = await resolveAlert(api.id);
        if (resolved) {
          console.log(`✅ Alert resolved for ${api.name}`);
        }
      }

      console.log(`✅ ${api.name} (${api.url}): ${result.status} (${result.response_time}ms)${result.error_message ? ` - ${result.error_message}` : ''}`);
    }

    console.log(`[${new Date().toISOString()}] Health check cycle completed`);
  } catch (error) {
    console.error('❌ Health check cycle failed:', error);
  } finally {
    db.close();
  }
}

// Run the health check
pingApis();
