"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [title, setTitle] = useState("");

  async function load() {
    setPosts(await api<PostRow[]>("/posts"));
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title.trim()) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await api("/posts", { method: "POST", json: { title, slug } });
    setTitle("");
    load();
  }

  async function publish(id: string) {
    await api(`/posts/${id}/publish`, { method: "POST", json: {} });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    await api(`/posts/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title="Blog Posts" subtitle="Write and publish articles" />
      <div className="p-8">
        <div className="mb-4 flex gap-2 rounded-xl border border-slate-200 bg-white p-4">
          <input className="fc-input" placeholder="New post title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button onClick={create} className="rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white">Create</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0">
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-slate-400">/blog/{p.slug}</div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className={p.status === "published" ? "text-green-600" : "text-amber-600"}>{p.status}</span>
                {p.status !== "published" && (
                  <button onClick={() => publish(p.id)} className="text-indigo-600">Publish</button>
                )}
                <button onClick={() => remove(p.id)} className="text-red-500">Delete</button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="px-5 py-6 text-sm text-slate-500">No posts yet.</p>}
        </div>
      </div>
    </div>
  );
}
