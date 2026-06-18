"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface PageRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  isHomepage: boolean;
  updatedAt: string;
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  async function load() {
    setPages(await api<PageRow[]>("/pages"));
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title.trim()) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await api("/pages", { method: "POST", json: { title, slug } });
    setTitle("");
    setCreating(false);
    load();
  }

  async function duplicate(id: string) {
    await api(`/pages/${id}/duplicate`, { method: "POST", json: {} });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this page?")) return;
    await api(`/pages/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Pages"
        subtitle="Create and manage your website pages"
        action={
          <button onClick={() => setCreating(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            New Page
          </button>
        }
      />
      <div className="p-8">
        {creating && (
          <div className="mb-4 flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
            <input className="fc-input" placeholder="Page title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
            <button onClick={create} className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white">Create</button>
            <button onClick={() => setCreating(false)} className="rounded-lg px-4 text-sm text-slate-500">Cancel</button>
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {pages.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0">
              <div>
                <div className="font-medium">
                  {p.title} {p.isHomepage && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">Home</span>}
                </div>
                <div className="text-xs text-slate-400">/{p.slug}</div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={p.status === "published" ? "text-green-600" : "text-amber-600"}>{p.status}</span>
                <Link href={`/admin/pages/${p.id}/edit`} className="font-medium text-indigo-600">Edit</Link>
                <button onClick={() => duplicate(p.id)} className="text-slate-500">Duplicate</button>
                <button onClick={() => remove(p.id)} className="text-red-500">Delete</button>
              </div>
            </div>
          ))}
          {pages.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No pages yet.</p>}
        </div>
      </div>
    </div>
  );
}
