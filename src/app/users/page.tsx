"use client";
import { useEffect, useState } from "react";

interface User {
  id: number;
  username: string;
  password: string;
  full_name: string;
  email: string;
  organization: string;
  role: string;
  phone: string;
  status: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<User>>({ status: "Active", role: "Viewer" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserRole();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch("/api/users");
    setUsers(await res.json());
    setLoading(false);
  }

  async function fetchCurrentUserRole() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const user = await res.json();
      setCurrentUserRole(user.role);
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({ status: "Active", role: "Viewer" });
    setEditingId(null);
    fetchUsers();
  }

  async function handleEdit(user: User) {
    setForm(user);
    setEditingId(user.id);
  }

  async function handleDeactivate(id: number) {
    setUserToDeactivate(id);
    setModalOpen(true);
  }

  async function confirmDeactivate() {
    if (userToDeactivate !== null) {
      await fetch(`/api/users/${userToDeactivate}/deactivate`, { method: "POST" });
      fetchUsers();
    }
    setModalOpen(false);
    setUserToDeactivate(null);
  }

  function cancelDeactivate() {
    setModalOpen(false);
    setUserToDeactivate(null);
  }

  async function handleDelete(id: number) {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (userToDelete !== null) {
      await fetch(`/api/users/${userToDelete}`, { method: "DELETE" });
      fetchUsers();
    }
    setDeleteModalOpen(false);
    setUserToDelete(null);
  }

  function cancelDelete() {
    setDeleteModalOpen(false);
    setUserToDelete(null);
  }

  // Filtered users
  const filtered = users.filter(u =>
    (roleFilter === "All" || u.role === roleFilter) &&
    (statusFilter === "All" || u.status === statusFilter) &&
    (
      search === "" ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
  );

  const ROLES = ["All", ...Array.from(new Set(users.map(u => u.role)))];
  const STATUSES = ["All", ...Array.from(new Set(users.map(u => u.status)))];

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Users</h1>
      {/* Filter/Search Bar */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by username, name, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded px-3 py-2">
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-3 py-2">
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 mb-8">
        {loading ? (
          <div className="text-center text-lg">Loading...</div>
        ) : (
          <table className="w-full text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <th className="py-2 px-3">Username</th>
                <th className="py-2 px-3">Full Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Org</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Phone</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3" colSpan={3}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr
                  key={u.id}
                  className={`border-t ${idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"} hover:bg-blue-50 dark:hover:bg-blue-950 transition`}
                >
                  <td className="py-2 px-3">{u.username}</td>
                  <td className="py-2 px-3">{u.full_name}</td>
                  <td className="py-2 px-3">{u.email}</td>
                  <td className="py-2 px-3">{u.organization}</td>
                  <td className="py-2 px-3">{u.role}</td>
                  <td className="py-2 px-3">{u.phone}</td>
                  <td className="py-2 px-3">{u.status}</td>
                  <td className="py-2 px-1">
                    {((currentUserRole === "SuperAdmin" && u.role === "SuperAdmin") ||
                      ((currentUserRole === "SuperAdmin" || currentUserRole === "Admin") && u.role !== "SuperAdmin")) && (
                      <button
                        className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
                        onClick={() => handleEdit(u)}
                        title="Edit"
                        aria-label="Edit"
                      >
                        ✏️
                      </button>
                    )}
                  </td>
                  <td className="py-2 px-1">
                    {u.role !== "SuperAdmin" && (currentUserRole === "SuperAdmin" || currentUserRole === "Admin") && (
                      <button
                        className={`p-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-800 ${u.status === "Inactive" ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => handleDeactivate(u.id)}
                        title="Deactivate"
                        aria-label="Deactivate"
                        disabled={u.status === "Inactive"}
                      >
                        🚫
                      </button>
                    )}
                  </td>
                  <td className="py-2 px-1">
                    {!(u.role === "SuperAdmin" || u.role === "Admin") && (currentUserRole === "SuperAdmin" || currentUserRole === "Admin") && (
                      <button
                        className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-800"
                        onClick={() => handleDelete(u.id)}
                        title="Delete"
                        aria-label="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {(currentUserRole === "SuperAdmin" || currentUserRole === "Admin") && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Edit User" : "Add New User"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input required placeholder="Username" value={form.username||""} onChange={e=>setForm(f=>({...f,username:e.target.value}))} className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              <input required placeholder="Password" value={form.password||""} onChange={e=>setForm(f=>({...f,password:e.target.value}))} className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" type="password" />
            </div>
            <div className="flex gap-4">
              <input required placeholder="Full Name" value={form.full_name||""} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              <input required placeholder="Email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))} className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" type="email" />
            </div>
            <div className="flex gap-4">
              <input placeholder="Organization" value={form.organization||""} onChange={e=>setForm(f=>({...f,organization:e.target.value}))} className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
              <input placeholder="Phone" value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} className="border rounded px-3 py-2 w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" />
            </div>
            <div className="flex gap-4">
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className="border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition">
                {currentUserRole === "SuperAdmin" && <option value="SuperAdmin">SuperAdmin</option>}
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Viewer">Viewer</option>
              </select>
              <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} className="border rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition" disabled={!(currentUserRole === "SuperAdmin" || currentUserRole === "Admin")}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition flex items-center gap-2" type="submit">
                {editingId ? "Update User" : "Add User"}
              </button>
              {editingId && (
                <button type="button" className="ml-2 text-gray-500 hover:text-gray-700" onClick={()=>{setEditingId(null);setForm({status:"Active",role:"Viewer"});}}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}
      {/* Custom Modal for Deactivate Confirmation */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Confirm Deactivation</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">Are you sure you want to deactivate this user?</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={cancelDeactivate}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                onClick={confirmDeactivate}
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Modal for Delete Confirmation */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-8 max-w-sm w-full border-t-8 border-red-600">
            <h3 className="text-xl font-bold mb-4 text-red-700 dark:text-red-400 flex items-center gap-2">
              <span className="text-2xl">🗑️</span> Confirm Delete
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300 font-medium">Are you absolutely sure you want to <span className="text-red-600 font-bold">delete</span> this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-bold shadow"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
