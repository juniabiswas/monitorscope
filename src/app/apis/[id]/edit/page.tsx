"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditApiPage() {
  const router = useRouter();
  const params = useParams();
  const apiId = params?.id;
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    category: "",
    environment: "",
    expected_response_time: "",
    alert_threshold: "",
    alert_interval: "15",
    active: true,
    headers: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [recipients, setRecipients] = useState<Array<{id: number, email: string, name: string, enabled: boolean}>>([]);
  const [newRecipient, setNewRecipient] = useState({email: "", name: ""});
  const [showAddRecipient, setShowAddRecipient] = useState(false);

  useEffect(() => {
    if (!apiId) return;
    fetch(`/api/apis/${apiId}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          name: data.name || "",
          url: data.url || "",
          description: data.description || "",
          category: data.category || "",
          environment: data.environment || "",
          expected_response_time: data.expected_response_time?.toString() || "",
          alert_threshold: data.alert_threshold?.toString() || "",
          alert_interval: data.alert_interval?.toString() || "15",
          active: !!data.active,
          headers: data.headers || "",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Load alert recipients
    loadRecipients();
  }, [apiId]);

  const loadRecipients = async () => {
    if (!apiId) return;
    try {
      const res = await fetch(`/api/alert-recipients?api_id=${apiId}`);
      if (res.ok) {
        const data = await res.json();
        setRecipients(data);
      }
    } catch (err) {
      console.error("Failed to load recipients:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/apis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: apiId,
          name: form.name,
          url: form.url,
          description: form.description,
          category: form.category,
          environment: form.environment,
          expected_response_time: Number(form.expected_response_time),
          alert_threshold: Number(form.alert_threshold),
          active: form.active,
          headers: form.headers
        })
      });
      if (!res.ok) throw new Error("Failed to update API");
      router.push("/apis");
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const addRecipient = async () => {
    if (!newRecipient.email || !apiId) return;

    try {
      const res = await fetch("/api/alert-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_id: apiId,
          email: newRecipient.email,
          name: newRecipient.name,
          enabled: true
        })
      });

      if (res.ok) {
        setNewRecipient({email: "", name: ""});
        setShowAddRecipient(false);
        loadRecipients();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add recipient");
      }
    } catch (err: any) {
      setError(err.message || "Failed to add recipient");
    }
  };

  const deleteRecipient = async (id: number) => {
    try {
      const res = await fetch("/api/alert-recipients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        loadRecipients();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete recipient");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete recipient");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 dark:bg-gray-950 py-8 px-2 sm:px-4 lg:px-8">
      <div className="w-full" style={{ maxWidth: "95vw" }}>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-8 max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-100">Edit API</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-medium" htmlFor="name">Name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="url">URL</label>
                <input id="url" name="url" value={form.url} onChange={handleChange} required className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="category">Category</label>
                <input id="category" name="category" value={form.category} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="environment">Environment</label>
                <input id="environment" name="environment" value={form.environment} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="expected_response_time">Expected Response Time (ms)</label>
                <input id="expected_response_time" name="expected_response_time" type="number" value={form.expected_response_time} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="alert_threshold">Alert Threshold (ms)</label>
                <input id="alert_threshold" name="alert_threshold" type="number" value={form.alert_threshold} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="alert_interval">Alert Interval (minutes)</label>
                <input id="alert_interval" name="alert_interval" type="number" min="1" value={form.alert_interval} onChange={handleChange} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">How often to send alerts when API is down (minimum 1 minute)</p>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium" htmlFor="description">Description</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium" htmlFor="headers">Headers (JSON format)</label>
                <textarea
                  id="headers"
                  name="headers"
                  value={form.headers}
                  onChange={handleChange}
                  rows={6}
                  placeholder='{"Authorization": "Bearer token", "Host": "api.example.com", "Accept": "application/json", "Content-Type": "application/json", "Accept-Language": "en-US"}'
                  className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter headers as JSON object. Example: {"{"}"Authorization": "Bearer token", "Host": "api.example.com"{"}"}
                </p>
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input id="active" name="active" type="checkbox" checked={form.active} onChange={handleChange} className="accent-blue-500" />
                <label htmlFor="active" className="font-medium">Active</label>
              </div>
            </div>

            {/* Alert Recipients Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Alert Recipients</h3>
              <div className="space-y-4">
                {recipients.map((recipient) => (
                  <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{recipient.email}</span>
                      {recipient.name && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({recipient.name})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRecipient(recipient.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {showAddRecipient ? (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={newRecipient.email}
                          onChange={(e) => setNewRecipient(prev => ({...prev, email: e.target.value}))}
                          placeholder="recipient@example.com"
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={newRecipient.name}
                          onChange={(e) => setNewRecipient(prev => ({...prev, name: e.target.value}))}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={addRecipient}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                      >
                        Add Recipient
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddRecipient(false);
                          setNewRecipient({email: "", name: ""});
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddRecipient(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                  >
                    + Add Alert Recipient
                  </button>
                )}

                {recipients.length === 0 && !showAddRecipient && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No alert recipients configured. Add recipients to receive email alerts when this API goes down.
                  </p>
                )}
              </div>
            </div>
            {error && <div className="text-red-500 text-center">{error}</div>}
            <div className="flex justify-center">
              <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
