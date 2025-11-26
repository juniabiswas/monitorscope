import { openDb } from '@/db';
import { EmailService } from './emailService';

interface ApiConfig {
  id: number;
  name: string;
  url: string;
  headers?: string;
  expected_response_time?: number;
  alert_threshold?: number;
  active: boolean;
}

interface HealthCheckResult {
  status: 'UP' | 'DOWN';
  response_time?: number;
  error_message?: string;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private emailService: EmailService;

  private constructor() {
    this.emailService = EmailService.getInstance();
  }

  public static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  public async performHealthCheck(apiId: number): Promise<HealthCheckResult> {
    try {
      const db = await openDb();
      const api = await db.get('SELECT * FROM apis WHERE id = ? AND active = 1', apiId);
      await db.close();

      if (!api) {
        throw new Error('API not found or inactive');
      }

      const result = await this.checkApiHealth(api);

      // Save health check result
      await this.saveHealthCheck(apiId, result);

      // Send email alert if API is down
      if (result.status === 'DOWN') {
        await this.sendAlert(api, result);
      }

      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      const errorResult: HealthCheckResult = {
        status: 'DOWN',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      };

      // Save error result
      await this.saveHealthCheck(apiId, errorResult);

      // Send alert for error
      const db = await openDb();
      const api = await db.get('SELECT * FROM apis WHERE id = ?', apiId);
      await db.close();

      if (api) {
        await this.sendAlert(api, errorResult);
      }

      return errorResult;
    }
  }

  private async checkApiHealth(api: ApiConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Parse headers if provided
      let headers: Record<string, string> = {};
      if (api.headers) {
        try {
          headers = JSON.parse(api.headers);
        } catch (e) {
          console.warn('Invalid headers JSON for API:', api.id);
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
      const responseTime = Date.now() - startTime;

      // Check if response is successful
      if (response.ok) {
        // Check response time threshold if configured
        if (api.alert_threshold && responseTime > api.alert_threshold) {
          return {
            status: 'DOWN',
            response_time: responseTime,
            error_message: `Response time ${responseTime}ms exceeds threshold of ${api.alert_threshold}ms`
          };
        }

        return {
          status: 'UP',
          response_time: responseTime
        };
      } else {
        return {
          status: 'DOWN',
          response_time: responseTime,
          error_message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            status: 'DOWN',
            response_time: responseTime,
            error_message: 'Request timeout (30s)'
          };
        }

        return {
          status: 'DOWN',
          response_time: responseTime,
          error_message: error.message
        };
      }

      return {
        status: 'DOWN',
        response_time: responseTime,
        error_message: 'Unknown error occurred'
      };
    }
  }

  private async saveHealthCheck(apiId: number, result: HealthCheckResult): Promise<void> {
    try {
      const db = await openDb();
      await db.run(
        'INSERT INTO health_checks (api_id, status, response_time) VALUES (?, ?, ?)',
        apiId, result.status, result.response_time || null
      );
      await db.close();
    } catch (error) {
      console.error('Failed to save health check:', error);
    }
  }

  private async sendAlert(api: ApiConfig, result: HealthCheckResult): Promise<void> {
    try {
      const alertData = {
        api_name: api.name,
        api_url: api.url,
        status: result.status,
        response_time: result.response_time,
        error_message: result.error_message,
        timestamp: new Date().toISOString()
      };

      await this.emailService.sendAlert(api.id, alertData);
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  public async checkAllApis(): Promise<void> {
    try {
      const db = await openDb();
      const apis = await db.all('SELECT * FROM apis WHERE active = 1');
      await db.close();

      const checkPromises = apis.map(api => this.performHealthCheck(api.id));
      await Promise.all(checkPromises);
    } catch (error) {
      console.error('Failed to check all APIs:', error);
    }
  }
}
