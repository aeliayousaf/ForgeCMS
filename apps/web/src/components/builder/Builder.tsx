"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Save, LayoutTemplate, Columns2, Columns3 } from "lucide-react";
import { getAllBlocks, getBlock, createColumnLayout } from "@forgecms/blocks";
import type { BlockNode, BlockType, PageDocument } from "@forgecms/shared";
import { api } from "@/lib/api";
import { PropsPanel } from "./PropsPanel";
import { CanvasNode, RootDropZone, collectIds } from "./CanvasNode";
import {
  findNode,
  removeNode,
  insertNode,
  duplicateNode,
  resolveInsertTarget,
  canAcceptChild,
  updateTree,
  isLayoutType,
} from "./tree";

let counter = 0;
const newId = () => `b-${Date.now().toString(36)}-${counter++}`;

export function Builder({
  pageId,
  initialDocument,
  initialMeta,
}: {
  pageId: string;
  initialDocument: PageDocument;
  initialMeta: { title: string; slug: string; status: string };
}) {
  const [blocks, setBlocks] = useState<BlockNode[]>(initialDocument.blocks ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [meta, setMeta] = useState(initialMeta);
  const [status, setStatus] = useState<string>("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const selected = findNode(blocks, selectedId ?? "")?.node ?? null;
  const insertTarget = resolveInsertTarget(blocks, selectedId);

  const layoutBlocks = getAllBlocks().filter((b) => isLayoutType(b.type));
  const contentBlocks = getAllBlocks().filter((b) => !isLayoutType(b.type));

  function addBlock(type: BlockType) {
    const def = getBlock(type);
    if (!def) return;

    const node: BlockNode = {
      id: newId(),
      type,
      props: structuredClone(def.defaultProps),
      ...(type === "section" || type === "container" || type === "column" ? { children: [] } : {}),
    };

    const { parentId } = insertTarget;
    if (parentId) {
      const parent = findNode(blocks, parentId)?.node;
      if (parent && !canAcceptChild(parent.type, type)) {
        setBlocks((b) => insertNode(b, null, node));
      } else {
        setBlocks((b) => insertNode(b, parentId, node));
      }
    } else {
      setBlocks((b) => insertNode(b, null, node));
    }
    setSelectedId(node.id);
  }

  function addColumnPreset(count: 2 | 3) {
    const layout = createColumnLayout(count, newId) as BlockNode;
    setBlocks((b) => [...b, layout]);
    setSelectedId(layout.id);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overData = over.data.current as { parentId?: string | null; kind?: string } | undefined;

    setBlocks((prev) => {
      const found = findNode(prev, activeId);
      if (!found) return prev;

      let next = removeNode(prev, activeId);
      const node = found.node;

      if (overData?.kind === "dropzone") {
        const parentId = overData.parentId ?? null;
        if (parentId) {
          const parent = findNode(next, parentId)?.node;
          if (parent && !canAcceptChild(parent.type, node.type)) return prev;
        }
        return insertNode(next, parentId, node);
      }

      const overId = String(over.id);
      const overFound = findNode(next, overId);
      if (!overFound) return insertNode(next, null, node);

      const parentPath = overFound.path.slice(0, -1);
      const parentId =
        parentPath.length > 0
          ? (() => {
              let list = next;
              for (let i = 0; i < parentPath.length - 1; i++) list = list[parentPath[i]].children ?? [];
              return list[parentPath[parentPath.length - 1]]?.id ?? null;
            })()
          : null;

      const idx = overFound.path[overFound.path.length - 1];
      return insertNode(next, parentId, node, idx);
    });
  }

  function updateProps(props: Record<string, unknown>) {
    if (!selectedId) return;
    setBlocks((b) => updateTree(b, selectedId, (n) => ({ ...n, props })));
  }

  const document: PageDocument = { version: 1, blocks };

  async function save() {
    setStatus("Saving...");
    await api(`/pages/${pageId}`, {
      method: "PUT",
      json: { document, title: meta.title, slug: meta.slug },
    });
    setStatus("Saved");
    setTimeout(() => setStatus(""), 1500);
  }

  async function publish() {
    await save();
    await api(`/pages/${pageId}/publish`, { method: "POST", json: {} });
    setStatus("Published");
    setMeta((m) => ({ ...m, status: "published" }));
    setTimeout(() => setStatus(""), 1500);
  }

  async function saveAsComponent() {
    if (!selected) return;
    const name = prompt("Component name?");
    if (!name) return;
    await api("/components", { method: "POST", json: { name, blocks: [selected] } });
    setStatus("Saved as component");
    setTimeout(() => setStatus(""), 1500);
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <input
            className="rounded border-0 bg-transparent text-sm font-semibold focus:outline-none"
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          />
          <span className="text-xs text-slate-400">/{meta.slug}</span>
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-slate-500">{status}</span>}
          <a href={`/${meta.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Preview
          </a>
          <button type="button" onClick={save} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
            <Save size={14} /> Save draft
          </button>
          <button type="button" onClick={publish} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Layout presets</h3>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => addColumnPreset(2)}
              className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <Columns2 size={14} /> 2 Col
            </button>
            <button
              type="button"
              onClick={() => addColumnPreset(3)}
              className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <Columns3 size={14} /> 3 Col
            </button>
          </div>

          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Structure</h3>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {layoutBlocks.map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => addBlock(def.type)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs hover:border-indigo-300 hover:bg-indigo-50"
              >
                <LayoutTemplate size={12} />
                {def.label}
              </button>
            ))}
          </div>

          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Widgets</h3>
          <p className="mb-2 text-[10px] leading-snug text-slate-400">
            Inserts into: {insertTarget.hint}. Select a column first to add widgets inside it.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {contentBlocks.map((def) => (
              <button
                key={def.type}
                type="button"
                onClick={() => addBlock(def.type)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-xs hover:border-indigo-300 hover:bg-indigo-50"
              >
                {def.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-200 p-6">
          <div className="mx-auto min-h-[600px] max-w-6xl bg-white shadow-sm">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={collectIds(blocks)} strategy={verticalListSortingStrategy}>
                <RootDropZone empty={blocks.length === 0} />
                {blocks.map((node) => (
                  <CanvasNode
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onDelete={(id) => {
                      setBlocks((b) => removeNode(b, id));
                      if (selectedId === id) setSelectedId(null);
                    }}
                    onDuplicate={(id) => setBlocks((b) => duplicateNode(b, id, newId))}
                    setBlocks={setBlocks}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          <PropsPanel block={selected} onChange={updateProps} />
          {selected && (
            <div className="border-t border-slate-100 p-4">
              <button type="button" onClick={saveAsComponent} className="w-full rounded-lg border border-slate-200 py-2 text-sm">
                Save as reusable component
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
