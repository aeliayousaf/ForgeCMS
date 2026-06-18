"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface MediaItem {
  id: string;
  originalName: string;
  mimeType: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    setItems(await api<MediaItem[]>(`/media${q}`));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      await fetch(`${API_BASE}/media/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": getCookie("fc_csrf") ?? "" },
        body: fd,
      });
    }
    setUploading(false);
    load();
  }

  async function remove(id: string) {
    await api(`/media/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader
        title="Media Library"
        subtitle="Images, PDFs and videos"
        action={
          <button onClick={() => fileRef.current?.click()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            {uploading ? "Uploading..." : "Upload"}
          </button>
        }
      />
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => upload(e.target.files)} />
      <div className="p-8">
        <div className="mb-4 flex gap-2">
          <input className="fc-input max-w-xs" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <button onClick={load} className="rounded-lg border border-slate-200 px-4 text-sm">Search</button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              {m.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.thumbnailUrl ?? m.url} alt={m.altText ?? m.originalName} className="h-28 w-full object-cover" />
              ) : (
                <div className="flex h-28 items-center justify-center bg-slate-100 text-xs text-slate-500">{m.mimeType}</div>
              )}
              <div className="truncate p-2 text-xs">{m.originalName}</div>
              <button onClick={() => remove(m.id)} className="absolute right-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100">
                Delete
              </button>
            </div>
          ))}
        </div>
        {items.length === 0 && <p className="text-sm text-slate-500">No media yet.</p>}
      </div>
    </div>
  );
}
