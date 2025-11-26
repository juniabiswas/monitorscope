"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  enabled: boolean;
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<EmailConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    loadEmailConfig();
  }, []);

  const loadEmailConfig = async () => {
    try {
      const res = await fetch("/api/email-config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else if (res.status === 403) {
        setAccessDenied(true);
      }
    } catch (err) {
      console.error("Failed to load email config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/email-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Email configuration saved successfully!");
      } else {
        setError(data.error || "Failed to save email configuration");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save email configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      setError("Please enter a test email address");
      return;
    }

    setTesting(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/email-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_email: testEmail })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("Test email sent successfully! Check your inbox.");
      } else {
        setError(data.message || "Failed to send test email");
      }
    } catch (err: any) {
      setError(err.message || "Failed to send test email");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-lg text-gray-700 dark:text-gray-200">Loading...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access email settings. This feature is only available to SuperAdmin and Admin users.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-2 sm:px-4 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-100">
            Email Alert Configuration
          </h1>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Configuration Notice:</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>Email settings are now managed via environment variables in the <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">.env</code> file for better security.</p>
              <p className="mt-1">To modify these settings, please update the <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">.env</code> file on the server and restart the application.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300" htmlFor="smtp_host">
                  SMTP Host *
                </label>
                <input
                  id="smtp_host"
                  name="smtp_host"
                  type="text"
                  value={config.smtp_host}
                  onChange={handleChange}
                  required
                  disabled
                  placeholder="smtp.gmail.com"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300" htmlFor="smtp_port">
                  SMTP Port *
                </label>
                <input
                  id="smtp_port"
                  name="smtp_port"
                  type="number"
                  value={config.smtp_port}
                  onChange={handleChange}
                  required
                  disabled
                  placeholder="587"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300" htmlFor="smtp_username">
                  SMTP Username *
                </label>
                <input
                  id="smtp_username"
                  name="smtp_username"
                  type="text"
                  value={config.smtp_username}
                  onChange={handleChange}
                  required
                  disabled
                  placeholder="your-email@gmail.com"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300" htmlFor="smtp_password">
                  SMTP Password *
                </label>
                <input
                  id="smtp_password"
                  name="smtp_password"
                  type="password"
                  value={config.smtp_password}
                  onChange={handleChange}
                  required
                  disabled
                  placeholder="Your app password"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300" htmlFor="from_email">
                  From Email *
                </label>
                <input
                  id="from_email"
                  name="from_email"
                  type="email"
                  value={config.from_email}
                  onChange={handleChange}
                  required
                  disabled
                  placeholder="alerts@yourcompany.com"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300" htmlFor="from_name">
                  From Name *
                </label>
                <input
                  id="from_name"
                  name="from_name"
                  type="text"
                  value={config.from_name}
                  onChange={handleChange}
                  required
                  disabled
                  placeholder="MonitorScope Alerts"
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="enabled"
                name="enabled"
                type="checkbox"
                checked={config.enabled}
                onChange={handleChange}
                disabled
                className="accent-blue-500 cursor-not-allowed"
              />
              <label htmlFor="enabled" className="font-medium text-gray-700 dark:text-gray-300">
                Enable email alerts
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-4">
                <p className="text-green-600 dark:text-green-400">{message}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Test email address"
                  className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !testEmail}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:opacity-50"
                >
                  {testing ? "Sending..." : "Test Email"}
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Popular SMTP Settings:</h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>Gmail:</strong> smtp.gmail.com:587 (use App Password)</p>
              <p><strong>Outlook:</strong> smtp-mail.outlook.com:587</p>
              <p><strong>Yahoo:</strong> smtp.mail.yahoo.com:587</p>
              <p><strong>SendGrid:</strong> smtp.sendgrid.net:587</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Setup Instructions:</h3>
            <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
              <p><strong>For Gmail:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Enable 2-Factor Authentication on your Google account</li>
                <li>Generate an App Password: Google Account → Security → App passwords</li>
                <li>Use your Gmail address as both username and from_email</li>
                <li>Use the App Password (not your regular password) as smtp_password</li>
              </ul>
              <p><strong>For Outlook/Hotmail:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Use your Outlook email address as username and from_email</li>
                <li>Use your regular Outlook password as smtp_password</li>
                <li>Make sure "Less secure app access" is enabled (if available)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
