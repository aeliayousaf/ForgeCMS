"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface UserRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  role: { name: string };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<{ name: string }[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleName: "editor" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setUsers(await api<UserRow[]>("/users"));
    setRoles(await api<{ name: string }[]>("/users/roles"));
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    try {
      await api("/users", { method: "POST", json: form });
      setForm({ name: "", email: "", password: "", roleName: "editor" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete user?")) return;
    await api(`/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage team members and roles" />
      <div className="p-8">
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Add user</h3>
          {error && <p className="mb-2 text-sm text-red-500">{error}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
            <input className="fc-input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="fc-input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="fc-input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="fc-input" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })}>
              {roles.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
            <button onClick={create} className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white">Add</button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-slate-400">{u.email}</div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{u.role.name}</span>
                <button onClick={() => remove(u.id)} className="text-red-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
