"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Api = {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  environment: string;
  expected_response_time: number;
  alert_threshold: number;
  active: boolean;
  // Add other fields as needed
};

export default function ApisPage() {
  const [apis, setApis] = useState<Api[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apis")
      .then((res) => res.json())
      .then((data) => {
        setApis(data);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this API?")) return;
    await fetch(`/api/apis/${id}`, { method: "DELETE" });
    setApis((prev) => prev.filter((api) => api.id !== id));
  };

  if (loading) return <div className="p-8">Loading...</div>;

return (
  <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 dark:bg-gray-950 py-8 px-2 sm:px-4 lg:px-8">
    <div className="w-full" style={{ maxWidth: "95vw" }}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 sm:p-8">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-100">APIs</h1>
        <div className="overflow-x-auto">
            <div className="mb-4">
              <Link href="/apis/new">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                  Add New API
                </button>
              </Link>
            </div>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <caption className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            List of APIs
          </caption>
           <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="py-3 px-4 text-left font-semibold">Name</th>
              <th className="py-3 px-4 text-left font-semibold">Description</th>
              <th className="py-3 px-4 font-semibold">URL</th>
              <th className="py-3 px-4 font-semibold">Category</th>
              <th className="py-3 px-4 font-semibold">Environment</th>
              <th className="py-3 px-4 font-semibold">Expected Response Time</th>
              <th className="py-3 px-4 font-semibold">Alert Threshold</th>
              <th className="py-3 px-4 font-semibold">Active</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">
            {apis.map((api) => (
              <tr key={api.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td className="py-2 px-4">{api.name}</td>
                <td className="py-2 px-4">{api.description}</td>
                <td className="py-2 px-4">{api.url}</td>
                <td className="py-2 px-4">{api.category}</td>
                <td className="py-2 px-4">{api.environment}</td>
                <td className="py-2 px-4">{api.expected_response_time} ms</td>
                <td className="py-2 px-4">{api.alert_threshold} ms</td>
                <td className="py-2 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={api.active}
                    readOnly
                    className="cursor-pointer accent-blue-500"
                  />
                </td>
                <td className="py-2 px-4 flex gap-2 justify-center">
                  <Link href={`/apis/${api.id}`}>
                    <button className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">View</button>
                  </Link>
                  <Link href={`/apis/${api.id}/edit`}>
                    <button className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">Edit</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(api.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </div>
);
}