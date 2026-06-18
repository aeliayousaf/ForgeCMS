"use client";

import type { BlockNode, ResponsiveStyles } from "@forgecms/shared";
import type { BuilderViewport } from "./viewport";
import { columnWidthPropKey } from "./viewport";
import {
  COLUMN_WIDTH_PRESETS,
  ROW_LAYOUT_PRESETS,
  getContainerColumns,
  layoutMatchesPreset,
  percentToFractionLabel,
  snapPercentToGrid,
  unitsToPercent,
  weightsToPercents,
} from "./column-layout";

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
  const value = Number(block.props[key] ?? block.props.widthPercent ?? 50);
  const fraction = percentToFractionLabel(value);

  return (
    <div className="space-y-3 border-t border-slate-100 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Column width ({viewport})
      </h4>
      <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
        <span className="text-lg font-bold text-indigo-600">{fraction}</span>
        <span className="ml-2 text-sm text-slate-500">{value}%</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {COLUMN_WIDTH_PRESETS.map((preset) => {
          const pct = unitsToPercent(preset.units);
          const active = value === pct;
          return (
            <button
              key={preset.label}
              type="button"
              title={`${preset.label} (${pct}%)`}
              onClick={() => onChange({ ...block.props, [key]: pct })}
              className={`rounded px-1 py-1.5 text-[10px] font-semibold ${
                active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
      <input
        type="range"
        min={8}
        max={100}
        step={8}
        value={value}
        onChange={(e) => onChange({ ...block.props, [key]: snapPercentToGrid(Number(e.target.value)) })}
        className="w-full accent-indigo-600"
      />
      <p className="text-[10px] text-slate-400">
        Widths snap to a 12-column grid (1/12 … 1/1). Drag handles between columns also snap.
      </p>
    </div>
  );
}

function LayoutPresetBar({ weights, active }: { weights: number[]; active: boolean }) {
  const percents = weightsToPercents(weights);
  return (
    <div className={`flex h-3 w-full overflow-hidden rounded ${active ? "ring-2 ring-indigo-500" : ""}`}>
      {percents.map((pct, i) => (
        <div
          key={i}
          className={`h-full ${active ? "bg-indigo-500" : "bg-slate-300"}`}
          style={{ width: `${pct}%` }}
        />
      ))}
    </div>
  );
}

export function ColumnLayoutPanel({
  container,
  viewport,
  onApplyLayout,
}: {
  container: BlockNode;
  viewport: BuilderViewport;
  onApplyLayout: (percents: number[]) => void;
}) {
  const columns = getContainerColumns(container);
  const widthKey = columnWidthPropKey(viewport);
  const presets = ROW_LAYOUT_PRESETS[columns.length] ?? [];

  if (columns.length === 0) {
    return (
      <div className="border-t border-slate-100 p-4">
        <p className="text-xs text-slate-400">Add columns to this container to choose a layout preset.</p>
      </div>
    );
  }

  const currentPercents = columns.map((col) =>
    Number(col.props[widthKey] ?? col.props.widthPercent ?? Math.floor(100 / columns.length)),
  );

  return (
    <div className="space-y-3 border-t border-slate-100 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Column layout ({viewport})
      </h4>
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <div className="mb-1 flex h-4 overflow-hidden rounded">
          {currentPercents.map((pct, i) => (
            <div
              key={i}
              className="flex items-center justify-center bg-indigo-500 text-[9px] font-bold text-white"
              style={{ width: `${pct}%` }}
              title={`${percentToFractionLabel(pct)} (${pct}%)`}
            >
              {pct >= 14 ? percentToFractionLabel(pct) : ""}
            </div>
          ))}
        </div>
        <p className="text-center text-[10px] text-slate-500">
          {currentPercents.map((p) => `${percentToFractionLabel(p)} (${p}%)`).join(" · ")}
        </p>
      </div>
      {presets.length > 0 ? (
        <div className="space-y-2">
          {presets.map((preset) => {
            const active = layoutMatchesPreset(columns, preset.weights, widthKey);
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onApplyLayout(weightsToPercents(preset.weights))}
                className={`w-full rounded-lg border p-2 text-left transition ${
                  active
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <span className="mb-1.5 block text-xs font-medium text-slate-700">{preset.label}</span>
                <LayoutPresetBar weights={preset.weights} active={active} />
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Adjust individual column widths using the presets above when a column is selected.
        </p>
      )}
    </div>
  );
}
