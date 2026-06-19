"use client";

import { useEffect, useRef, useState } from "react";
import { api, apiUpload, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface MediaItem {
  id: string;
  originalName: string;
  mimeType: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        await apiUpload("/media/upload", fd);
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mb-4 flex gap-2">
          <input className="fc-input max-w-xs" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
          <button onClick={load} className="rounded-lg border border-slate-200 px-4 text-sm">Search</button>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white">
              {m.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.thumbnailUrl ?? m.url}
                  alt={m.altText ?? m.originalName}
                  className="h-28 w-full object-cover"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (m.url && img.src !== m.url) img.src = m.url;
                  }}
                />
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
