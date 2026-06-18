"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface MenuItem {
  label: string;
  url: string;
}

export default function MenusPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [saved, setSaved] = useState(false);

  async function load() {
    const menu = await api<{ items: MenuItem[] }>("/menus/location/primary");
    setItems(menu.items.map((i) => ({ label: i.label, url: i.url })));
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    await api("/menus/primary", { method: "PUT", json: { items } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <PageHeader
        title="Menus"
        subtitle="Primary navigation"
        action={
          <button onClick={save} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
            {saved ? "Saved" : "Save menu"}
          </button>
        }
      />
      <div className="max-w-2xl p-8">
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3">
              <input className="fc-input" placeholder="Label" value={item.label} onChange={(e) => setItems(items.map((it, i) => (i === idx ? { ...it, label: e.target.value } : it)))} />
              <input className="fc-input" placeholder="/url" value={item.url} onChange={(e) => setItems(items.map((it, i) => (i === idx ? { ...it, url: e.target.value } : it)))} />
              <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="px-3 text-red-500">Remove</button>
            </div>
          ))}
        </div>
        <button onClick={() => setItems([...items, { label: "", url: "/" }])} className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500">
          + Add menu item
        </button>
      </div>
    </div>
  );
}
