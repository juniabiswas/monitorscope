"use client";
import { useEffect, useState } from "react";

const TABS = [
  { key: "tiles", label: "Tiles" },
  { key: "honeycomb", label: "Honeycomb" },
  { key: "list", label: "List" },
];

interface Api {
  id: number;
  name: string;
  url: string;
  category: string;
  environment: string;
  active: boolean;
  alert_threshold?: number;
  health?: {
    id: number;
    api_id: number;
    status: string;
    response_time?: number;
    checked_at: string;
  } | null;
}

interface HealthCheck {
  id: number;
  api_id: number;
  status: string;
  response_time?: number;
  checked_at: string;
}

function getStatusColor(api: Api) {
  if (!api.health) return "#6b7280";
  if (
    typeof api.alert_threshold === "number" &&
    api.health.response_time != null &&
    api.health.response_time > api.alert_threshold
  ) {
    return "#eab308"; // yellow for degraded
  }
  if (api.health.status?.toLowerCase() === "healthy") return "#22c55e"; // green
  if (["down", "unhealthy"].includes(api.health.status?.toLowerCase())) return "#ef4444"; // red
  return "#6b7280";
}
function getStatusLabel(api: Api) {
  if (!api.health) return "No Data";
  if (
    typeof api.alert_threshold === "number" &&
    api.health.response_time != null &&
    api.health.response_time > api.alert_threshold
  ) {
    return "Degraded";
  }
  return api.health.status || "No Data";
}

export default function HealthChecksPage() {
  const [tab, setTab] = useState("tiles");
  const [category, setCategory] = useState("All");
  const [environment, setEnvironment] = useState("All");
  const [urlFilter, setUrlFilter] = useState("");
  const [apis, setApis] = useState<Api[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll data every 15 seconds
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [apisRes, healthRes] = await Promise.all([
          fetch("/api/apis").then(r => r.json()),
          fetch("/api/health-checks").then(r => r.json()),
        ]);
        setApis(apisRes);
        setHealthChecks(healthRes);
      } catch {
        setApis([]);
        setHealthChecks([]);
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchData();

    // Set up polling every 15 seconds
    const interval = setInterval(fetchData, 15000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Reduce health checks to latest per api_id
  const latestHealth = healthChecks.reduce((acc, hc) => {
    if (!acc[hc.api_id] || new Date(hc.checked_at) > new Date(acc[hc.api_id].checked_at)) {
      acc[hc.api_id] = hc;
    }
    return acc;
  }, {} as Record<number, HealthCheck>);

  // Filter active APIs and join with latest health check
  const filtered = apis
    .filter(api => api.active !== false)
    .filter(api =>
      (category === "All" || api.category === category) &&
      (environment === "All" || api.environment === environment) &&
      (urlFilter === "" || api.url.toLowerCase().includes(urlFilter.toLowerCase()))
    )
    .map(api => ({
      ...api,
      health: latestHealth[api.id] || null,
    }));

  // Collect unique categories and environments for filters
  const CATEGORIES = ["All", ...Array.from(new Set(apis.map(a => a.category).filter(Boolean)))];
  const ENVIRONMENTS = ["All", ...Array.from(new Set(apis.map(a => a.environment).filter(Boolean)))];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">API Health Check Status</h1>
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded px-3 py-2">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={environment} onChange={e => setEnvironment(e.target.value)} className="border rounded px-3 py-2">
          {ENVIRONMENTS.map(e => <option key={e}>{e}</option>)}
        </select>
        <input
          type="text"
          placeholder="URL contains..."
          value={urlFilter}
          onChange={e => setUrlFilter(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
        />
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-4 py-2 rounded-t font-semibold border-b-2 transition-all ${tab === t.key ? "border-blue-600 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200" : "border-transparent bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div>
        {loading ? (
          <div className="text-center text-lg">Loading...</div>
        ) : tab === "tiles" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map(api => (
              <div key={api.id} className="rounded-xl shadow p-6 bg-white dark:bg-gray-900 flex flex-col gap-2 border-t-4"
                style={{ borderColor: getStatusColor(api) }}>
                <div className="text-lg font-bold">{api.name}</div>
                <div className="text-xs text-gray-500 break-all">{api.url}</div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{api.category}</span>
                  <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">{api.environment}</span>
                </div>
                <div className="mt-2 font-semibold text-sm" style={{ color: getStatusColor(api) }}>{getStatusLabel(api)}</div>
                <div className="text-xs text-gray-400">{api.health?.checked_at ? new Date(api.health.checked_at + 'Z').toLocaleString() : ""}</div>
                {api.health?.response_time != null && (
                  <div className="text-xs text-gray-500">Response: {api.health.response_time} ms</div>
                )}
              </div>
            ))}
          </div>
        ) : tab === "honeycomb" ? (
          <div className="flex flex-wrap gap-4 justify-center">
            {filtered.map(api => (
              <div key={api.id} className="w-32 h-32 bg-white dark:bg-gray-900 rounded-[20%] shadow flex flex-col items-center justify-center border-2"
                style={{ borderColor: getStatusColor(api) }}>
                <div className="font-bold text-center text-sm mb-1">{api.name}</div>
                <div className="text-[10px] text-gray-500 text-center mb-1">{api.environment}</div>
                <div className="font-semibold text-xs" style={{ color: getStatusColor(api) }}>{getStatusLabel(api)}</div>
                {api.health?.response_time != null && (
                  <div className="text-[10px] text-gray-500">{api.health.response_time} ms</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">URL</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Env</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Checked At</th>
                <th className="py-2 px-3">Response Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(api => (
                <tr key={api.id} className="border-t hover:bg-blue-50 dark:hover:bg-blue-950 transition">
                  <td className="py-2 px-3 font-semibold">{api.name}</td>
                  <td className="py-2 px-3 text-xs text-gray-500 break-all">{api.url}</td>
                  <td className="py-2 px-3">{api.category}</td>
                  <td className="py-2 px-3">{api.environment}</td>
                  <td className="py-2 px-3 font-semibold" style={{ color: getStatusColor(api) }}>{getStatusLabel(api)}</td>
                  <td className="py-2 px-3 text-xs text-gray-400">{api.health?.checked_at ? new Date(api.health.checked_at + 'Z').toLocaleString() : ""}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{api.health?.response_time != null ? api.health.response_time + ' ms' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
