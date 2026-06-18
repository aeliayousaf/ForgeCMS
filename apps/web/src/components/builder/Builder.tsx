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
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy, Save } from "lucide-react";
import { getAllBlocks, getBlock, BlockRenderer } from "@forgecms/blocks";
import type { BlockNode, BlockType, PageDocument } from "@forgecms/shared";
import { api } from "@/lib/api";
import { PropsPanel } from "./PropsPanel";

let counter = 0;
const newId = () => `b-${Date.now().toString(36)}-${counter++}`;

function SortableBlock({
  node,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  node: BlockNode;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const def = getBlock(node.type);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={onSelect}
      className={`group relative border-2 ${selected ? "border-indigo-500" : "border-transparent hover:border-indigo-200"}`}
    >
      <div className="absolute -left-3 top-2 z-10 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
        <button {...attributes} {...listeners} className="cursor-grab rounded bg-slate-800 p-1 text-white">
          <GripVertical size={14} />
        </button>
      </div>
      <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100">
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded bg-slate-800 p-1 text-white">
          <Copy size={14} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded bg-red-600 p-1 text-white">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="pointer-events-none">
        {def ? <BlockRenderer document={{ version: 1, blocks: [node] }} /> : <div className="p-4 text-red-500">Unknown: {node.type}</div>}
      </div>
    </div>
  );
}

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
  const selected = blocks.find((b) => b.id === selectedId) ?? null;

  function addBlock(type: BlockType) {
    const def = getBlock(type);
    if (!def) return;
    const node: BlockNode = { id: newId(), type, props: structuredClone(def.defaultProps) };
    setBlocks((b) => [...b, node]);
    setSelectedId(node.id);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function updateProps(props: Record<string, unknown>) {
    setBlocks((b) => b.map((n) => (n.id === selectedId ? { ...n, props } : n)));
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
          <a href={`/${meta.slug}`} target="_blank" className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Preview
          </a>
          <button onClick={save} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
            <Save size={14} /> Save draft
          </button>
          <button onClick={publish} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        <div className="w-56 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Add blocks</h3>
          <div className="grid grid-cols-2 gap-2">
            {getAllBlocks().map((def) => (
              <button
                key={def.type}
                onClick={() => addBlock(def.type)}
                className="rounded-lg border border-slate-200 px-2 py-2 text-xs hover:border-indigo-300 hover:bg-indigo-50"
              >
                {def.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          <div className="mx-auto max-w-4xl bg-white shadow-sm">
            {blocks.length === 0 ? (
              <p className="p-16 text-center text-slate-400">Add blocks from the left to start building.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((node) => (
                    <SortableBlock
                      key={node.id}
                      node={node}
                      selected={node.id === selectedId}
                      onSelect={() => setSelectedId(node.id)}
                      onDelete={() => setBlocks((b) => b.filter((n) => n.id !== node.id))}
                      onDuplicate={() =>
                        setBlocks((b) => {
                          const idx = b.findIndex((n) => n.id === node.id);
                          const copy = { ...structuredClone(node), id: newId() };
                          return [...b.slice(0, idx + 1), copy, ...b.slice(idx + 1)];
                        })
                      }
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Properties */}
        <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          <PropsPanel block={selected} onChange={updateProps} />
          {selected && (
            <div className="border-t border-slate-100 p-4">
              <button onClick={saveAsComponent} className="w-full rounded-lg border border-slate-200 py-2 text-sm">
                Save as reusable component
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
