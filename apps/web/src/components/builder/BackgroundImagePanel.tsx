"use client";

import { useEffect, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { api } from "@/lib/api";

interface MediaItem {
  id: string;
  originalName: string;
  url: string;
  thumbnailUrl: string | null;
}

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api<MediaItem[]>("/media")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Choose from media library</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-sm text-slate-400">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-slate-400">No images yet. Upload some in Media Library first.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-lg border border-slate-200 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl ?? item.url}
                    alt={item.originalName}
                    className="aspect-square w-full object-cover"
                  />
                  <p className="truncate px-1 py-1 text-[10px] text-slate-500">{item.originalName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function BackgroundImagePanel({
  block,
  onChange,
}: {
  block: { props: Record<string, unknown> };
  onChange: (props: Record<string, unknown>) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const props = block.props;
  const imageUrl = String(props.backgroundImage ?? "");
  const size = String(props.backgroundSize ?? "cover");
  const scroll = String(props.backgroundScroll ?? "static");
  const overlayOpacity = Number(props.backgroundOverlayOpacity ?? 0);

  function patch(partial: Record<string, unknown>) {
    onChange({ ...props, ...partial });
  }

  return (
    <div className="space-y-4 border-t border-slate-100 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Background image</h4>

      {imageUrl ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="h-28 w-full object-cover" />
          <button
            type="button"
            onClick={() => patch({ backgroundImage: "" })}
            className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-medium text-red-600 shadow"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
          <ImageIcon size={24} />
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Image URL</span>
        <input
          className="fc-input"
          value={imageUrl}
          onChange={(e) => patch({ backgroundImage: e.target.value })}
          placeholder="https://..."
        />
      </label>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="w-full rounded-lg border border-indigo-200 bg-indigo-50 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
      >
        Choose from library
      </button>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-500">Image fit</span>
        <div className="grid grid-cols-3 gap-1">
          {(
            [
              ["cover", "Cover (fill)"],
              ["contain", "Contain (fit)"],
              ["stretch", "Stretch (full)"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => patch({ backgroundSize: value })}
              className={`rounded px-1 py-1.5 text-[10px] font-semibold ${
                size === value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-500">Position</span>
        <select
          className="fc-input"
          value={String(props.backgroundPosition ?? "center")}
          onChange={(e) => patch({ backgroundPosition: e.target.value })}
        >
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div>
        <span className="mb-1 block text-xs font-medium text-slate-500">Scroll effect</span>
        <div className="grid grid-cols-2 gap-1">
          {(
            [
              ["static", "Static"],
              ["parallax", "Parallax"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => patch({ backgroundScroll: value })}
              className={`rounded px-2 py-1.5 text-xs font-semibold ${
                scroll === value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {scroll === "parallax" && (
          <p className="mt-1 text-[10px] text-slate-400">Background stays fixed while content scrolls (disabled on mobile).</p>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Overlay color</span>
        <input
          className="fc-input"
          type="color"
          value={String(props.backgroundOverlay ?? "#000000").startsWith("#") ? String(props.backgroundOverlay) : "#000000"}
          onChange={(e) => patch({ backgroundOverlay: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Overlay opacity ({overlayOpacity}%)</span>
        <input
          type="range"
          min={0}
          max={100}
          value={overlayOpacity}
          onChange={(e) => patch({ backgroundOverlayOpacity: Number(e.target.value) })}
          className="w-full accent-indigo-600"
        />
      </label>

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(url) => patch({ backgroundImage: url })} />
    </div>
  );
}

const LAYOUT_WITH_BACKGROUND = new Set(["section", "container", "column"]);

export function isLayoutBackgroundBlock(type: string): boolean {
  return LAYOUT_WITH_BACKGROUND.has(type);
}
