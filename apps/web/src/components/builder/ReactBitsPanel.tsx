"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { searchReactBitsLocal, type ReactBitsSearchResult } from "@/lib/react-bits/search";
import { PaletteDraggable, paletteReactBitsId } from "./PaletteDraggable";

export type { ReactBitsSearchResult };

const CATEGORY_LABELS: Record<string, string> = {
  background: "Background",
  animation: "Animation",
  text: "Text",
  interactive: "Interactive",
  other: "Other",
};

export function ReactBitsPanel({ onInsert }: { onInsert: (slug: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReactBitsSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      const q = query.trim();
      const path = q ? `/integrations/react-bits?q=${encodeURIComponent(q)}&limit=40` : "/integrations/react-bits?limit=40";
      api<ReactBitsSearchResult[]>(path)
        .then(setResults)
        .catch(() => setResults(searchReactBitsLocal(q)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="border-t border-slate-200 pt-3">
      <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-slate-400">
        <Sparkles size={12} /> React Bits
      </h3>
      <div className="relative mb-2">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="fc-input w-full pl-7 text-xs"
          placeholder="Search animations, backgrounds…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {loading ? (
        <p className="py-4 text-center text-xs text-slate-400">Searching…</p>
      ) : results.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">No components found.</p>
      ) : (
        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {results.map((item) => (
            <PaletteDraggable
              key={item.slug}
              id={paletteReactBitsId(item.slug)}
              label={item.title}
              data={{ kind: "reactbits", slug: item.slug }}
              onClick={() => onInsert(item.slug)}
              className="!flex w-full flex-col items-start gap-0.5 !px-2 !py-2 text-left"
            >
              <span className="flex w-full items-center justify-between gap-1">
                <span className="font-medium text-slate-700">{item.title}</span>
                <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[9px] uppercase text-slate-500">
                  {CATEGORY_LABELS[item.category] ?? item.category}
                </span>
              </span>
              <span className="line-clamp-2 text-[10px] leading-snug text-slate-400">{item.description}</span>
            </PaletteDraggable>
          ))}
        </div>
      )}
    </div>
  );
}
