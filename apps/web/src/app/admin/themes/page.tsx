"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/AdminShell";

interface Theme {
  id: string;
  key: string;
  name: string;
  category?: string;
  isActive: boolean;
  config: { colors: Record<string, string> };
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);

  async function load() {
    setThemes(await api<Theme[]>("/themes"));
  }
  useEffect(() => {
    load();
  }, []);

  async function activate(key: string) {
    await api("/themes/activate", { method: "POST", json: { key } });
    load();
  }

  return (
    <div>
      <PageHeader title="Themes" subtitle="Switch themes without losing your content" />
      <div className="grid grid-cols-1 gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => (
          <div key={t.id} className={`rounded-xl border bg-white p-4 ${t.isActive ? "border-indigo-500 ring-1 ring-indigo-200" : "border-slate-200"}`}>
            <div className="mb-3 flex gap-1.5">
              {Object.values(t.config?.colors ?? {}).slice(0, 5).map((c, i) => (
                <span key={i} className="h-8 w-8 rounded-full border border-slate-200" style={{ background: c }} />
              ))}
            </div>
            <div className="font-semibold">{t.name}</div>
            <div className="mb-3 text-xs text-slate-400">{t.category}</div>
            {t.isActive ? (
              <span className="text-sm font-medium text-indigo-600">Active</span>
            ) : (
              <button onClick={() => activate(t.key)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                Activate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
