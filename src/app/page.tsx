"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (typeof window === 'undefined') return;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark, mounted]);

  const toggle = () => setIsDark((prev) => !prev);
  return [isDark, toggle, mounted] as const;
}

function getStatusColor(hc, api) {
  if (!hc) return "#6b7280";
  if (
    api && typeof api.alert_threshold === "number" &&
    hc.response_time != null &&
    hc.response_time > api.alert_threshold
  ) {
    return "#eab308"; // yellow for degraded
  }
  if (hc.status?.toLowerCase() === "healthy") return "#22c55e"; // green
  if (["down", "unhealthy"].includes(hc.status?.toLowerCase())) return "#ef4444"; // red
  return "#6b7280";
}
function getStatusLabel(hc, api) {
  if (!hc) return "No Data";
  if (
    api && typeof api.alert_threshold === "number" &&
    hc.response_time != null &&
    hc.response_time > api.alert_threshold
  ) {
    return "Degraded";
  }
  return hc.status || "No Data";
}

function RecentHealthChecks({ apis }) {
  const [healthChecks, setHealthChecks] = useState<Array<{ id: number; api_id: number; status: string; checked_at: string; response_time?: number }>>([]);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchHealthChecks() {
      try {
        const res = await fetch("/api/health-checks");
        if (!res.ok) throw new Error("/api/health-checks returned " + res.status);
        setHealthChecks(await res.json());
      } catch {
        setHealthChecks([]);
      }
    }
    fetchHealthChecks();
    interval = setInterval(fetchHealthChecks, 10000);
    return () => clearInterval(interval);
  }, []);
  // Reduce to latest per api_id
  const latest = healthChecks.reduce((acc, hc) => {
    if (!acc[hc.api_id] || new Date(hc.checked_at) > new Date(acc[hc.api_id].checked_at)) {
      acc[hc.api_id] = hc;
    }
    return acc;
  }, {});
  return (
    <ul>
      {Object.values(latest).map((hc) => {
        const api = apis.find((a) => a.id === hc.api_id);
        const color = getStatusColor(hc, api);
        const label = getStatusLabel(hc, api);
        return (
          <li key={hc.id} className="mb-2 flex justify-between items-center">
            <span>API #{hc.api_id}{api ? `: ${api.name}` : ""}</span>
            <span className="font-semibold" style={{ color }}>{label}</span>
            <span className="text-xs text-gray-400">
              {hc.checked_at ? (() => {
                const date = new Date(hc.checked_at + 'Z');
                const now = new Date();
                const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
                if (diff < 60) return `${diff} sec ago`;
                if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
                if (diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
                return date.toLocaleDateString();
              })() : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function Home() {
  // State for APIs, health checks, and alerts
  const [apis, setApis] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, toggleDark, mounted] = useDarkMode();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch data from backend
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [apisRes, alertsRes] = await Promise.all([
          fetch("/api/apis").then(async (r) => {
            if (!r.ok) throw new Error("/api/apis returned " + r.status);
            return await r.json();
          }),
          fetch("/api/alerts?unresolved=1").then(async (r) => {
            if (!r.ok) throw new Error("/api/alerts returned " + r.status);
            return await r.json();
          }),
        ]);
        setApis(apisRes);
        setAlerts(alertsRes);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setApis([]);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (!mounted) {
    // Prevent hydration mismatch by not rendering until theme is known
    return null;
  }

  return (
    <div className={`theme-root font-sans min-h-screen flex flex-col ${isDark ? 'theme-dark' : ''}`}> 
      {/* Header */}
      {/* Main Content */}
      <main className="flex-1 p-8 pb-20 gap-16 sm:p-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            API Health Check Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Monitor your APIs, view health checks, and manage alerts.
          </p>
        </header>
        {loading ? (
          <div className="text-center text-lg">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* APIs List */}
            <section className="card-section bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">APIs</h2>
              <ul>
                {apis.map(
                  (api: { id: number; name: string; url: string }) => (
                    <li key={api.id} className="mb-2">
                      <span className="font-medium">{api.name}</span>
                      <div className="text-xs text-gray-500 break-all">
                        {api.url}
                      </div>
                    </li>
                  )
                )}
              </ul>
            </section>
            {/* Health Checks */}
            <section className="card-section bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-6">
              <RecentHealthChecks apis={apis} />
            </section>
            {/* Alerts */}
            <section className="card-section bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
              <ul>
                {alerts.length === 0 && (
                  <li className="text-green-600">No active alerts 🎉</li>
                )}
                {alerts.map(
                  (alert: {
                    id: number;
                    api_id: number;
                    message: string;
                    triggered_at: string;
                  }) => (
                    <li key={alert.id} className="mb-2">
                      <span className="font-medium">API #{alert.api_id}</span>
                      <div className="text-xs text-red-600">{alert.message}</div>
                      <div className="text-xs text-gray-400">
                        {alert.triggered_at?.slice(0, 19).replace("T", " ")}
                      </div>
                    </li>
                  )
                )}
              </ul>
            </section>
          </div>
        )}
      </main>
      {/* Footer */}
    </div>
  );
}
