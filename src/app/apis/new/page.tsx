"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddApiPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    url: "",
    description: "",
    category: "",
    environment: "",
    expected_response_time: "",
    alert_threshold: "",
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" && e.target instanceof HTMLInputElement
          ? e.target.checked
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expected_response_time: Number(form.expected_response_time),
          alert_threshold: Number(form.alert_threshold),
        }),
      });
      if (!res.ok) throw new Error("Failed to add API");
      router.push("/apis");
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 dark:bg-gray-950 py-8 px-2 sm:px-4 lg:px-8">
      <div className="w-full" style={{ maxWidth: "95vw" }}>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-8 max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-100">Add New API</h1>
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
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium" htmlFor="description">Description</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div className="flex items-center gap-2 md:col-span-2">
                <input id="active" name="active" type="checkbox" checked={form.active} onChange={handleChange} className="accent-blue-500" />
                <label htmlFor="active" className="font-medium">Active</label>
              </div>
            </div>
            {error && <div className="text-red-500 text-center">{error}</div>}
            <div className="flex justify-center">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50">
                {loading ? "Adding..." : "Add API"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
