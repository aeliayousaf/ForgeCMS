"use client";

import { useCallback, useEffect, useState } from "react";
import { getReactBitsEntry } from "@/lib/react-bits/manifest";
import type { ReactBitsPropField } from "@/lib/react-bits/prop-schema";
import { buildReactBitsUsageSnippet } from "@/lib/react-bits/usage-snippet";
import type { BlockNode } from "@forgecms/shared";

type CodeTab = "usage" | "source" | "props";

function PropFieldInput({
  field,
  value,
  onChange,
}: {
  field: ReactBitsPropField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select className="fc-input" value={String(value ?? field.options?.[0]?.value ?? "")} onChange={(e) => onChange(e.target.value)}>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "number") {
    return (
      <input
        className="fc-input"
        type="number"
        value={value === undefined || value === null ? "" : Number(value)}
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }

  if (field.type === "color") {
    const str = String(value ?? "");
    const pickerValue = /^#[0-9a-fA-F]{6}$/.test(str) ? str : "#4f46e5";
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="fc-input min-w-0 flex-1"
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? "#000000"}
        />
      </div>
    );
  }

  if (field.type === "colors") {
    const colors = Array.isArray(value) ? (value as string[]) : [];
    const slots = Math.max(3, colors.length || 3);
    const list = Array.from({ length: slots }, (_, i) => colors[i] ?? "#5227FF");

    return (
      <div className="space-y-2">
        {list.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 text-[10px] text-slate-400">{i + 1}</span>
            <input
              type="color"
              className="h-8 w-9 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
              value={/^#[0-9a-fA-F]{6}$/.test(c) ? c : "#5227FF"}
              onChange={(e) => {
                const next = [...list];
                next[i] = e.target.value;
                onChange(next.filter(Boolean));
              }}
            />
            <input
              className="fc-input min-w-0 flex-1 font-mono text-xs"
              value={c}
              onChange={(e) => {
                const next = [...list];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-xs text-indigo-600 hover:underline"
          onClick={() => onChange([...list, "#ffffff"])}
        >
          + Add colour
        </button>
      </div>
    );
  }

  return (
    <input
      className="fc-input"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  );
}

function CodeBlock({
  code,
  path,
  editable,
  onChange,
  onApply,
  error,
}: {
  code: string;
  path?: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  onApply?: () => void;
  error?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {path ? <span className="truncate font-mono text-[10px] text-slate-400">{path}</span> : <span />}
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {editable ? (
        <>
          <textarea
            className="fc-input max-h-64 min-h-[8rem] w-full resize-y font-mono text-xs"
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              className="w-full rounded-lg border border-slate-200 py-1.5 text-xs hover:bg-slate-50"
            >
              Apply JSON
            </button>
          )}
        </>
      ) : (
        <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-100">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

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
  const [showCode, setShowCode] = useState(false);
  const [codeTab, setCodeTab] = useState<CodeTab>("usage");
  const [jsonText, setJsonText] = useState(() => JSON.stringify(componentProps, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(JSON.stringify(componentProps, null, 2));
    setJsonError(null);
  }, [slug, block.id, JSON.stringify(componentProps)]);

  const loadSource = useCallback(async () => {
    if (!slug) return;
    setSourceLoading(true);
    setSourceError(null);
    try {
      const res = await fetch(`/react-bits-source/${encodeURIComponent(slug)}`, { credentials: "include" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to load source (${res.status})`);
      }
      const data = (await res.json()) as { source: string; path: string };
      setSourceCode(data.source);
      setSourcePath(data.path);
    } catch (err) {
      setSourceCode(null);
      setSourcePath(null);
      setSourceError(err instanceof Error ? err.message : "Failed to load source");
    } finally {
      setSourceLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    setSourceCode(null);
    setSourcePath(null);
    setSourceError(null);
  }, [slug]);

  useEffect(() => {
    if (showCode && codeTab === "source" && sourceCode === null && !sourceLoading && !sourceError) {
      void loadSource();
    }
  }, [showCode, codeTab, sourceCode, sourceLoading, sourceError, loadSource]);

  if (!entry) {
    return (
      <div className="border-t border-slate-100 p-4 text-sm text-red-600">
        Unknown React Bits component: {slug || "(empty)"}
      </div>
    );
  }

  const mergedProps = { ...entry.defaultProps, ...componentProps };
  const usageSnippet = buildReactBitsUsageSnippet(entry, mergedProps);

  function updateComponentProps(next: Record<string, unknown>) {
    onChange({ ...block.props, componentProps: next });
    setJsonText(JSON.stringify(next, null, 2));
    setJsonError(null);
  }

  function setField(key: string, value: unknown) {
    const next = { ...componentProps, [key]: value };
    if (value === undefined || value === "") {
      delete next[key];
    }
    updateComponentProps(next);
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      setJsonError(null);
      updateComponentProps(parsed);
    } catch {
      setJsonError("Invalid JSON");
    }
  }

  const schema = entry.propSchema ?? [];

  return (
    <div className="space-y-4 border-t border-slate-100 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{entry.title}</h4>
        <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
        <a
          href="https://reactbits.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-indigo-600 hover:underline"
        >
          Docs on React Bits →
        </a>
      </div>

      {entry.supportsChildren && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
          Drop Heading, Text, or Button blocks inside this component on the canvas for content.
        </p>
      )}

      {schema.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Settings</p>
          {schema.map((field) => (
            <label key={field.key} className="block">
              {field.type !== "boolean" && (
                <span className="mb-1 block text-xs font-medium text-slate-500">{field.label}</span>
              )}
              <PropFieldInput
                field={field}
                value={mergedProps[field.key]}
                onChange={(v) => setField(field.key, v)}
              />
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No visual settings detected — edit props in the Code panel below.</p>
      )}

      <div className="border-t border-slate-100 pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-xs font-medium text-slate-500"
          onClick={() => setShowCode((v) => !v)}
        >
          Code
          <span>{showCode ? "▾" : "▸"}</span>
        </button>
        {showCode && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-1 rounded-lg border border-slate-200 p-0.5">
              {(
                [
                  ["usage", "Usage"],
                  ["source", "Component"],
                  ["props", "Props JSON"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCodeTab(id)}
                  className={`flex-1 rounded-md px-2 py-1 text-[10px] font-medium ${
                    codeTab === id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {codeTab === "usage" && (
              <>
                <p className="text-[10px] text-slate-500">
                  Copy this snippet to use the component with your current settings in a custom React file.
                </p>
                <CodeBlock code={usageSnippet} />
              </>
            )}

            {codeTab === "source" && (
              <>
                <p className="text-[10px] text-slate-500">
                  Full component source from your project. Edit the file in{" "}
                  <code className="rounded bg-slate-100 px-1">apps/web/src/components/</code> and run{" "}
                  <code className="rounded bg-slate-100 px-1">pnpm react-bits:sync</code> after changes.
                </p>
                {sourceLoading && <p className="text-xs text-slate-500">Loading source…</p>}
                {sourceError && (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600">{sourceError}</p>
                    <button
                      type="button"
                      onClick={() => void loadSource()}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {sourceCode && (
                  <CodeBlock code={sourceCode} path={sourcePath ?? entry.sourceFile} />
                )}
              </>
            )}

            {codeTab === "props" && (
              <>
                <p className="text-[10px] text-slate-500">
                  Per-block props stored in the page JSON. Use this for fine-grained overrides.
                </p>
                <CodeBlock
                  code={jsonText}
                  editable
                  onChange={setJsonText}
                  onApply={applyJson}
                  error={jsonError}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
