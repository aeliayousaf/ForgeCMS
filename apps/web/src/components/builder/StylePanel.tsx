"use client";

import type { BlockNode, ResponsiveStyles } from "@forgecms/shared";
import type { BuilderViewport } from "./viewport";
import { columnWidthPropKey } from "./viewport";

const SPACING_PRESETS = [
  { label: "None", value: "0" },
  { label: "XS", value: "0.5rem" },
  { label: "SM", value: "1rem" },
  { label: "MD", value: "2rem" },
  { label: "LG", value: "3rem" },
  { label: "XL", value: "4rem" },
];

function SpacingControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      <div className="mb-2 flex flex-wrap gap-1">
        {SPACING_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.value)}
            className={`rounded px-2 py-0.5 text-[10px] font-medium ${
              value === p.value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <input className="fc-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="e.g. 2rem" />
    </div>
  );
}

export function StylePanel({
  block,
  onChange,
}: {
  block: BlockNode;
  onChange: (styles: ResponsiveStyles | undefined) => void;
}) {
  const styles = block.styles ?? {};
  const base = styles.base ?? {};

  function patchBase(patch: Partial<typeof base>) {
    onChange({ ...styles, base: { ...base, ...patch } });
  }

  return (
    <div className="space-y-4 border-t border-slate-100 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Spacing &amp; style</h4>
      <SpacingControl label="Padding top/bottom" value={base.paddingY} onChange={(v) => patchBase({ paddingY: v || undefined })} />
      <SpacingControl label="Padding left/right" value={base.paddingX} onChange={(v) => patchBase({ paddingX: v || undefined })} />
      <SpacingControl label="Margin top/bottom" value={base.marginY} onChange={(v) => patchBase({ marginY: v || undefined })} />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Background</span>
        <input
          className="fc-input"
          type="color"
          value={base.backgroundColor?.startsWith("#") ? base.backgroundColor : "#ffffff"}
          onChange={(e) => patchBase({ backgroundColor: e.target.value })}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Text color</span>
        <input
          className="fc-input"
          type="color"
          value={base.textColor?.startsWith("#") ? base.textColor : "#0f172a"}
          onChange={(e) => patchBase({ textColor: e.target.value })}
        />
      </label>
    </div>
  );
}

export function ColumnWidthPanel({
  block,
  viewport,
  onChange,
}: {
  block: BlockNode;
  viewport: BuilderViewport;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const key = columnWidthPropKey(viewport);
  const value = block.props[key] ?? block.props.widthPercent ?? 50;

  return (
    <div className="space-y-3 border-t border-slate-100 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Column width ({viewport})
      </h4>
      <input
        type="range"
        min={10}
        max={90}
        value={Number(value)}
        onChange={(e) => onChange({ ...block.props, [key]: Number(e.target.value) })}
        className="w-full accent-indigo-600"
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>10%</span>
        <span className="font-semibold text-indigo-600">{Number(value)}%</span>
        <span>90%</span>
      </div>
      <p className="text-[10px] text-slate-400">
        Leave tablet/mobile empty in Content tab to inherit desktop width. Resize handles update the active viewport.
      </p>
    </div>
  );
}
