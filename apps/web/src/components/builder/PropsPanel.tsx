"use client";

import { useMemo, useState } from "react";
import { getBlock, type EditorField } from "@forgecms/blocks";
import type { BlockNode, ResponsiveStyles } from "@forgecms/shared";
import { StylePanel, ColumnWidthPanel, ColumnLayoutPanel } from "./StylePanel";
import { BackgroundImagePanel, isLayoutBackgroundBlock } from "./BackgroundImagePanel";
import { ReactBitsPropsPanel } from "./ReactBitsPropsPanel";
import type { BuilderViewport } from "./viewport";
import { findNode, getParentId } from "./tree";

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: EditorField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "textarea" || field.type === "richtext") {
    return (
      <textarea
        className="fc-input"
        rows={field.type === "richtext" ? 6 : 3}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select className="fc-input" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "boolean") {
    return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (field.type === "number") {
    return (
      <input
        className="fc-input"
        type="number"
        value={value === undefined || value === null || value === "" ? "" : Number(value)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }
  if (field.type === "list") {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    return (
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex justify-between text-xs text-slate-400">
              <span>Item {idx + 1}</span>
              <button type="button" className="text-red-500" onClick={() => onChange(items.filter((_, i) => i !== idx))}>
                Remove
              </button>
            </div>
            {field.itemFields?.map((sub) => (
              <label key={sub.key} className="mb-2 block">
                <span className="mb-1 block text-xs font-medium text-slate-500">{sub.label}</span>
                <FieldInput
                  field={sub}
                  value={item[sub.key]}
                  onChange={(v) => onChange(items.map((it, i) => (i === idx ? { ...it, [sub.key]: v } : it)))}
                />
              </label>
            ))}
          </div>
        ))}
        <button
          type="button"
          className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm text-slate-500"
          onClick={() => {
            const blank: Record<string, unknown> = {};
            field.itemFields?.forEach((f) => (blank[f.key] = f.type === "number" ? 0 : ""));
            onChange([...items, blank]);
          }}
        >
          + Add item
        </button>
      </div>
    );
  }
  return (
    <input
      className="fc-input"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder ?? (field.type === "image" ? "Image URL" : "")}
    />
  );
}

export function PropsPanel({
  block,
  blocks,
  viewport,
  onChange,
  onStylesChange,
  onApplyContainerLayout,
}: {
  block: BlockNode | null;
  blocks: BlockNode[];
  viewport: BuilderViewport;
  onChange: (props: Record<string, unknown>) => void;
  onStylesChange: (styles: ResponsiveStyles | undefined) => void;
  onApplyContainerLayout: (containerId: string, percents: number[]) => void;
}) {
  const [tab, setTab] = useState<"content" | "style">("content");

  const containerContext = useMemo(() => {
    if (!block) return null;
    if (block.type === "container") return block;
    if (block.type === "column") {
      const parentId = getParentId(blocks, block.id);
      if (!parentId) return null;
      const parent = findNode(blocks, parentId)?.node;
      return parent?.type === "container" ? parent : null;
    }
    return null;
  }, [block, blocks]);

  if (!block) {
    return <p className="p-4 text-sm text-slate-400">Select a block to edit its content.</p>;
  }
  const def = getBlock(block.type);
  if (!def) return <p className="p-4 text-sm text-slate-400">Unknown block.</p>;

  return (
    <div>
      <div className="flex border-b border-slate-100">
        {(["content", "style"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide ${
              tab === t ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <div className="space-y-4 p-4">
          {block.type === "reactBits" ? (
            <ReactBitsPropsPanel block={block} onChange={onChange} />
          ) : (
            <>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{def.label}</h3>
              {def.editorFields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-500">{field.label}</span>
                  <FieldInput
                    field={field}
                    value={block.props[field.key]}
                    onChange={(v) => onChange({ ...block.props, [field.key]: v })}
                  />
                </label>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "style" && (
        <>
          <StylePanel block={block} onChange={onStylesChange} />
          {isLayoutBackgroundBlock(block.type) && (
            <BackgroundImagePanel block={block} onChange={onChange} />
          )}
          {containerContext && (
            <ColumnLayoutPanel
              container={containerContext}
              viewport={viewport}
              onApplyLayout={(percents) => onApplyContainerLayout(containerContext.id, percents)}
            />
          )}
          {block.type === "column" && (
            <ColumnWidthPanel block={block} viewport={viewport} onChange={onChange} />
          )}
        </>
      )}
    </div>
  );
}
