"use client";

import { useState } from "react";
import { getReactBitsEntry } from "@/lib/react-bits/manifest";
import type { BlockNode } from "@forgecms/shared";

export function ReactBitsPropsPanel({
  block,
  onChange,
}: {
  block: BlockNode;
  onChange: (props: Record<string, unknown>) => void;
}) {
  const slug = String(block.props.slug ?? "");
  const entry = getReactBitsEntry(slug);
  const componentProps = (block.props.componentProps as Record<string, unknown>) ?? {};
  const [jsonText, setJsonText] = useState(() => JSON.stringify(componentProps, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!entry) {
    return (
      <div className="border-t border-slate-100 p-4 text-sm text-red-600">
        Unknown React Bits component: {slug || "(empty)"}
      </div>
    );
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      setJsonError(null);
      onChange({ ...block.props, componentProps: parsed });
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  return (
    <div className="space-y-4 border-t border-slate-100 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{entry.title}</h4>
        <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
        <a
          href={`https://reactbits.dev/get-started/mcp`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-indigo-600 hover:underline"
        >
          View on React Bits →
        </a>
      </div>
      <div className="rounded-lg bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
        Slug: <code>{slug}</code>
        {entry.supportsChildren && " · Supports nested widgets"}
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">Component props (JSON)</span>
        <textarea
          className="fc-input font-mono text-xs"
          rows={8}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          onBlur={applyJson}
        />
        {jsonError && <p className="mt-1 text-xs text-red-600">{jsonError}</p>}
      </label>
      <button type="button" onClick={applyJson} className="w-full rounded-lg border border-slate-200 py-1.5 text-xs hover:bg-slate-50">
        Apply props
      </button>
    </div>
  );
}
