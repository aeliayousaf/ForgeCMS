"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Save, LayoutTemplate, Columns2, Columns3, Monitor, Tablet, Smartphone, Puzzle } from "lucide-react";
import { getAllBlocks, getBlock, createColumnLayout } from "@forgecms/blocks";
import type { BlockNode, BlockType, PageDocument, ResponsiveStyles } from "@forgecms/shared";
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
  applyDragMove,
  cloneBlockForest,
} from "./tree";
import { VIEWPORT_WIDTHS, type BuilderViewport } from "./viewport";

let counter = 0;
const newId = () => `b-${Date.now().toString(36)}-${counter++}`;

interface SavedComponent {
  id: string;
  name: string;
  blocks: BlockNode[];
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
  const [viewport, setViewport] = useState<BuilderViewport>("desktop");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savedComponents, setSavedComponents] = useState<SavedComponent[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const selected = findNode(blocks, selectedId ?? "")?.node ?? null;
  const insertTarget = resolveInsertTarget(blocks, selectedId);

  const layoutBlocks = getAllBlocks().filter((b) => isLayoutType(b.type));
  const contentBlocks = getAllBlocks().filter((b) => !isLayoutType(b.type));

  useEffect(() => {
    api<SavedComponent[]>("/components")
      .then(setSavedComponents)
      .catch(() => setSavedComponents([]));
  }, []);

  function insertNodes(nodes: BlockNode[]) {
    const { parentId } = insertTarget;
    setBlocks((b) => {
      let next = b;
      for (const node of nodes) {
        if (parentId) {
          const parent = findNode(next, parentId)?.node;
          if (parent && !canAcceptChild(parent.type, node.type)) {
            next = insertNode(next, null, node);
          } else {
            next = insertNode(next, parentId, node);
          }
        } else {
          next = insertNode(next, null, node);
        }
      }
      return next;
    });
    if (nodes[0]) setSelectedId(nodes[0].id);
  }

  function addBlock(type: BlockType) {
    const def = getBlock(type);
    if (!def) return;

    const node: BlockNode = {
      id: newId(),
      type,
      props: structuredClone(def.defaultProps),
      ...(isLayoutType(type) ? { children: [] } : {}),
    };
    insertNodes([node]);
  }

  function insertSavedComponent(comp: SavedComponent) {
    const raw = Array.isArray(comp.blocks) ? comp.blocks : [];
    if (raw.length === 0) return;
    const cloned = cloneBlockForest(raw as BlockNode[], newId);
    insertNodes(cloned);
    setStatus(`Inserted "${comp.name}"`);
    setTimeout(() => setStatus(""), 1500);
  }

  function addColumnPreset(count: 2 | 3) {
    const layout = createColumnLayout(count, newId) as BlockNode;
    setBlocks((b) => [...b, layout]);
    setSelectedId(layout.id);
  }

  function onDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overData = over.data.current as { parentId?: string | null; kind?: string } | undefined;

    setBlocks((prev) => applyDragMove(prev, activeId, String(over.id), overData));
  }

  function updateProps(props: Record<string, unknown>) {
    if (!selectedId) return;
    setBlocks((b) => updateTree(b, selectedId, (n) => ({ ...n, props })));
  }

  function updateStyles(styles: ResponsiveStyles | undefined) {
    if (!selectedId) return;
    setBlocks((b) => updateTree(b, selectedId, (n) => ({ ...n, styles })));
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
    const list = await api<SavedComponent[]>("/components");
    setSavedComponents(list);
    setStatus("Saved as component");
    setTimeout(() => setStatus(""), 1500);
  }

  const draggingNode = draggingId ? findNode(blocks, draggingId)?.node : null;

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
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5">
          {(
            [
              ["desktop", Monitor],
              ["tablet", Tablet],
              ["mobile", Smartphone],
            ] as const
          ).map(([vp, Icon]) => (
            <button
              key={vp}
              type="button"
              title={vp}
              onClick={() => setViewport(vp)}
              className={`rounded-md p-1.5 ${viewport === vp ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
            >
              <Icon size={16} />
            </button>
          ))}
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
            <button type="button" onClick={() => addColumnPreset(2)} className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <Columns2 size={14} /> 2 Col
            </button>
            <button type="button" onClick={() => addColumnPreset(3)} className="flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <Columns3 size={14} /> 3 Col
            </button>
          </div>

          {savedComponents.length > 0 && (
            <>
              <h3 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase text-slate-400">
                <Puzzle size={12} /> Saved
              </h3>
              <div className="mb-4 space-y-1">
                {savedComponents.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => insertSavedComponent(c)}
                    className="w-full rounded-lg border border-slate-200 px-2 py-2 text-left text-xs hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}

          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Structure</h3>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {layoutBlocks.map((def) => (
              <button key={def.type} type="button" onClick={() => addBlock(def.type)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs hover:border-indigo-300 hover:bg-indigo-50">
                <LayoutTemplate size={12} />
                {def.label}
              </button>
            ))}
          </div>

          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Widgets</h3>
          <p className="mb-2 text-[10px] leading-snug text-slate-400">Inserts into: {insertTarget.hint}. Drag widgets between columns on the canvas.</p>
          <div className="grid grid-cols-2 gap-2">
            {contentBlocks.map((def) => (
              <button key={def.type} type="button" onClick={() => addBlock(def.type)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs hover:border-indigo-300 hover:bg-indigo-50">
                {def.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-300 p-6">
          <div
            className="mx-auto min-h-[600px] bg-white shadow-lg transition-all duration-300"
            style={{ width: VIEWPORT_WIDTHS[viewport], maxWidth: "100%" }}
          >
            <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <SortableContext items={collectIds(blocks)} strategy={verticalListSortingStrategy}>
                <RootDropZone empty={blocks.length === 0} />
                {blocks.map((node) => (
                  <CanvasNode
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    viewport={viewport}
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
              <DragOverlay>
                {draggingNode ? (
                  <div className="rounded-lg border-2 border-indigo-500 bg-white px-4 py-2 text-sm font-medium shadow-xl">
                    {getBlock(draggingNode.type)?.label ?? draggingNode.type}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        <div className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          <PropsPanel block={selected} viewport={viewport} onChange={updateProps} onStylesChange={updateStyles} />
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
