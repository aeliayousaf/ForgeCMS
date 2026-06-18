"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface SavedComponent {
  id: string;
  name: string;
  type: string;
  isGlobal: boolean;
}

export default function ComponentsPage() {
  const [components, setComponents] = useState<SavedComponent[]>([]);

  async function load() {
    setComponents(await api<SavedComponent[]>("/components"));
  }
  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await api(`/components/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <PageHeader title="Components" subtitle="Reusable sections you saved from the builder" />
      <div className="p-8">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {components.map((c) => (
            <div key={c.id} className="flex items-center justify-between border-b border-slate-100 px-5 py-3 last:border-0">
              <div className="font-medium">{c.name}</div>
              <button onClick={() => remove(c.id)} className="text-sm text-red-500">Delete</button>
            </div>
          ))}
          {components.length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-500">
              No saved components yet. Open a page in the builder, select a block, and choose &ldquo;Save as reusable component&rdquo;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
