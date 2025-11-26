import { openDb } from '@/db';

export interface AlertData {
  api_id: number;
  message: string;
  status: 'active' | 'resolved';
}

export class AlertService {
  /**
   * Create a new alert or update existing active alert
   */
  static async createOrUpdateAlert(apiId: number, message: string): Promise<number> {
    const db = await openDb();

    try {
      // Check if there's an active alert for this API
      const existingAlert = await db.get(
        'SELECT id FROM alerts WHERE api_id = ? AND status = "active"',
        apiId
      );

      if (existingAlert) {
        // Update existing alert with new message and increment count
        await db.run(
          'UPDATE alerts SET message = ?, alert_count = alert_count + 1, last_alert_sent = CURRENT_TIMESTAMP WHERE id = ?',
          message,
          existingAlert.id
        );
        await db.close();
        return existingAlert.id;
      } else {
        // Create new alert
        const result = await db.run(
          'INSERT INTO alerts (api_id, message, status, last_alert_sent) VALUES (?, ?, "active", CURRENT_TIMESTAMP)',
          apiId,
          message
        );
        await db.close();
        return result.lastID!;
      }
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  /**
   * Resolve an active alert
   */
  static async resolveAlert(apiId: number): Promise<boolean> {
    const db = await openDb();

    try {
      const result = await db.run(
        'UPDATE alerts SET status = "resolved", resolved_at = CURRENT_TIMESTAMP WHERE api_id = ? AND status = "active"',
        apiId
      );
      await db.close();
      return result.changes > 0;
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  /**
   * Check if an alert should be sent based on interval
   */
  static async shouldSendAlert(apiId: number, alertIntervalMinutes: number): Promise<boolean> {
    const db = await openDb();

    try {
      const alert = await db.get(
        'SELECT last_alert_sent FROM alerts WHERE api_id = ? AND status = "active" ORDER BY triggered_at DESC LIMIT 1',
        apiId
      );

      await db.close();

      if (!alert || !alert.last_alert_sent) {
        return true; // No previous alert, send immediately
      }

      const lastAlertTime = new Date(alert.last_alert_sent);
      const now = new Date();
      const minutesSinceLastAlert = (now.getTime() - lastAlertTime.getTime()) / (1000 * 60);

      return minutesSinceLastAlert >= alertIntervalMinutes;
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  /**
   * Get active alerts for an API
   */
  static async getActiveAlerts(apiId: number): Promise<any[]> {
    const db = await openDb();

    try {
      const alerts = await db.all(
        'SELECT * FROM alerts WHERE api_id = ? AND status = "active" ORDER BY triggered_at DESC',
        apiId
      );
      await db.close();
      return alerts;
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  /**
   * Get all alerts for an API
   */
  static async getAlerts(apiId: number, limit: number = 50): Promise<any[]> {
    const db = await openDb();

    try {
      const alerts = await db.all(
        'SELECT * FROM alerts WHERE api_id = ? ORDER BY triggered_at DESC LIMIT ?',
        apiId,
        limit
      );
      await db.close();
      return alerts;
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  /**
   * Get all active alerts across all APIs
   */
  static async getAllActiveAlerts(): Promise<any[]> {
    const db = await openDb();

    try {
      const alerts = await db.all(`
        SELECT a.*, apis.name as api_name, apis.url as api_url
        FROM alerts a
        JOIN apis ON a.api_id = apis.id
        WHERE a.status = "active"
        ORDER BY a.triggered_at DESC
      `);
      await db.close();
      return alerts;
    } catch (error) {
      await db.close();
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  static async getAlertStats(): Promise<any> {
    const db = await openDb();

    try {
      const stats = await db.get(`
        SELECT
          COUNT(*) as total_alerts,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_alerts,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_alerts,
          AVG(alert_count) as avg_alert_count
        FROM alerts
      `);
      await db.close();
      return stats;
    } catch (error) {
      await db.close();
      throw error;
    }
  }
}

