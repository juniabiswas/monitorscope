"use client";

import { useEffect, useState } from "react";

interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  email: string;
  organization: string;
  role: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch profile");
        }
        const user = await res.json();
        setUser(user);
      } catch (e: any) {
        setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-primary dark:text-primary-dark text-center">My Profile</h2>
        {loading ? (
          <div className="text-center text-lg text-gray-700 dark:text-gray-200">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600 dark:text-red-400">{error}</div>
        ) : user ? (
          <div className="space-y-4">
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Username</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.username}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Full Name</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.full_name}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Email</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.email}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Organization</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.organization}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Role</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.role}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Phone</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.phone}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Status</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.status}</span>
            </div>
            <div>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">Created At</span>
              <span className="block text-lg font-semibold text-secondary dark:text-gray-200">{user.created_at?.slice(0, 19).replace("T", " ")}</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
