"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface BackupRow {
  id: string;
  filename: string;
  type: string;
  size: number;
  status: string;
  createdAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBackups(await api<BackupRow[]>("/backups"));
  }
  useEffect(() => {
    load();
  }, []);

  async function create(type: string) {
    setBusy(true);
    await api("/backups", { method: "POST", json: { type } });
    setBusy(false);
    load();
  }

  async function restore(id: string) {
    if (!confirm("Restore this backup? This will overwrite current data.")) return;
    await api(`/backups/${id}/restore`, { method: "POST", json: {} });
    alert("Restore complete");
  }

  async function remove(id: string) {
    await api(`/backups/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Backups"
        subtitle="Database and file backups"
        action={
          <div className="flex gap-2">
            <button onClick={() => create("database")} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Database</button>
            <button onClick={() => create("files")} disabled={busy} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Files</button>
            <button onClick={() => create("full")} disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
              {busy ? "Working..." : "Full backup"}
            </button>
          </div>
        }
      />
      <div className="p-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {backups.map((b) => (
            <div key={b.id} className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0">
              <div>
                <div className="font-medium">{b.filename}</div>
                <div className="text-xs text-slate-400">
                  {b.type} · {(b.size / 1024 / 1024).toFixed(2)} MB · {new Date(b.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={b.status === "completed" ? "text-green-600" : b.status === "failed" ? "text-red-500" : "text-amber-600"}>{b.status}</span>
                {b.status === "completed" && (
                  <>
                    <a href={`${API_BASE}/backups/${b.id}/download`} className="text-indigo-600">Download</a>
                    {b.type === "database" && <button onClick={() => restore(b.id)} className="text-slate-600">Restore</button>}
                  </>
                )}
                <button onClick={() => remove(b.id)} className="text-red-500">Delete</button>
              </div>
            </div>
          ))}
          {backups.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No backups yet.</p>}
        </div>
      </div>
    </div>
  );
}
