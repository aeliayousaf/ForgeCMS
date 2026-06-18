"use client";

import { useCallback, useRef, type CSSProperties } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { BlockRenderer, getBlock } from "@forgecms/blocks";
import type { BlockNode } from "@forgecms/shared";
import { isLayoutType, resizeColumns } from "./tree";
import { columnWidthPropKey, columnCssVarsFromProps, getColumnWidthPercent, type BuilderViewport } from "./viewport";

function ColumnResizeHandle({
  containerId,
  leftId,
  rightId,
  viewport,
  onResize,
}: {
  containerId: string;
  leftId: string;
  rightId: string;
  viewport: BuilderViewport;
  onResize: (updater: (prev: BlockNode[]) => BlockNode[]) => void;
}) {
  const dragging = useRef(false);
  const startX = useRef(0);
  const widthKey = columnWidthPropKey(viewport);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const deltaPx = ev.clientX - startX.current;
        if (Math.abs(deltaPx) < 4) return;
        startX.current = ev.clientX;
        const deltaPercent = deltaPx / 8;
        onResize((prev) => resizeColumns(prev, containerId, leftId, rightId, deltaPercent, widthKey));
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [containerId, leftId, rightId, onResize, widthKey],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      className="group/handle relative z-20 flex w-4 shrink-0 cursor-col-resize items-center justify-center"
    >
      <div className="h-12 w-1.5 rounded-full bg-indigo-400 opacity-40 transition group-hover/handle:opacity-100" />
    </div>
  );
}

function DropZone({
  id,
  parentId,
  label,
  compact,
}: {
  id: string;
  parentId: string | null;
  label?: string;
  compact?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { parentId, kind: "dropzone" } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed transition ${
        compact ? "min-h-[28px] py-1" : "min-h-[48px]"
      } ${isOver ? "border-indigo-500 bg-indigo-100" : "border-slate-200 bg-slate-50/80"}`}
    >
      {label && <p className={`text-center text-slate-400 ${compact ? "text-[10px] px-1" : "text-xs p-2"}`}>{label}</p>}
    </div>
  );
}

function InsertSlot({ beforeId }: { beforeId: string }) {
  const id = `insert-before-${beforeId}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { kind: "insert" } });
  return (
    <div
      ref={setNodeRef}
      className={`relative z-10 transition-all ${isOver ? "h-8 bg-indigo-200" : "h-2 hover:h-3 hover:bg-indigo-100"}`}
    />
  );
}

function SortableCanvasBlock({
  node,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
  renderChildren,
}: {
  node: BlockNode;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  renderChildren?: (node: BlockNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { type: node.type, nodeId: node.id },
  });
  const def = getBlock(node.type);
  const isLayout = isLayoutType(node.type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative ${isLayout ? "my-0.5" : ""} border-2 ${
        selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-indigo-200"
      }`}
    >
      <div className="absolute -left-3 top-2 z-30 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
        <button type="button" {...attributes} {...listeners} className="cursor-grab rounded bg-slate-800 p-1 text-white shadow">
          <GripVertical size={14} />
        </button>
      </div>
      <div className="absolute right-2 top-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100">
        <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="rounded bg-slate-800 p-1 text-white shadow">
          <Copy size={14} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded bg-red-600 p-1 text-white shadow">
          <Trash2 size={14} />
        </button>
      </div>

      {isLayout && renderChildren ? (
        renderChildren(node)
      ) : (
        <div className="pointer-events-none">
          {def ? <BlockRenderer document={{ version: 1, blocks: [node] }} /> : <div className="p-4 text-red-500">Unknown: {node.type}</div>}
        </div>
      )}
    </div>
  );
}

export function CanvasNode({
  node,
  selectedId,
  viewport,
  onSelect,
  onDelete,
  onDuplicate,
  setBlocks,
}: {
  node: BlockNode;
  selectedId: string | null;
  viewport: BuilderViewport;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  setBlocks: React.Dispatch<React.SetStateAction<BlockNode[]>>;
}) {
  const selected = node.id === selectedId;
  const def = getBlock(node.type);

  const renderChildren = (layoutNode: BlockNode) => {
    const props = { ...def?.defaultProps, ...layoutNode.props };
    const children = layoutNode.children ?? [];

    if (layoutNode.type === "section") {
      return (
        <div
          style={{
            padding: `${props.paddingY ?? "2rem"} ${props.paddingX ?? "1rem"}`,
            backgroundColor: (props.backgroundColor as string) || "#f8fafc",
            minHeight: "60px",
          }}
        >
          <InsertSlot beforeId={layoutNode.id} />
          {children.length === 0 ? (
            <DropZone id={`drop-${layoutNode.id}`} parentId={layoutNode.id} label="Drop container here" />
          ) : (
            children.map((child) => (
              <div key={child.id}>
                <CanvasNode
                  node={child}
                  selectedId={selectedId}
                  viewport={viewport}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  setBlocks={setBlocks}
                />
                <InsertSlot beforeId={child.id} />
              </div>
            ))
          )}
        </div>
      );
    }

    if (layoutNode.type === "container") {
      const columns = children.filter((c) => c.type === "column");
      return (
        <div
          style={{
            display: "flex",
            flexDirection: ((props.direction as string) ?? "row") as CSSProperties["flexDirection"],
            flexWrap: props.wrap ? "wrap" : "nowrap",
            gap: (props.gap as string) ?? "0",
            alignItems: ((props.align as string) ?? "stretch") as CSSProperties["alignItems"],
            width: "100%",
            minHeight: "80px",
            padding: "0.25rem",
          }}
        >
          {columns.length === 0 ? (
            <DropZone id={`drop-${layoutNode.id}`} parentId={layoutNode.id} label="Add columns" />
          ) : (
            columns.map((col, idx) => {
              const w = getColumnWidthPercent(col.props, viewport);
              return (
                <div
                  key={col.id}
                  style={{
                    display: "flex",
                    ...columnCssVarsFromProps(col.props),
                    flex: `0 0 ${w}%`,
                    maxWidth: `${w}%`,
                    minWidth: 0,
                  }}
                >
                  <CanvasNode
                    node={col}
                    selectedId={selectedId}
                    viewport={viewport}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    setBlocks={setBlocks}
                  />
                  {idx < columns.length - 1 && (
                    <ColumnResizeHandle
                      containerId={layoutNode.id}
                      leftId={col.id}
                      rightId={columns[idx + 1].id}
                      viewport={viewport}
                      onResize={(updater) => setBlocks(updater)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (layoutNode.type === "column") {
      return (
        <div
          style={{
            width: "100%",
            minHeight: (props.minHeight as string) ?? "80px",
            padding: (props.padding as string) ?? "0.5rem",
            backgroundColor: (props.backgroundColor as string) || "rgba(255,255,255,0.6)",
            border: selected ? "2px solid transparent" : "1px dashed #94a3b8",
            boxSizing: "border-box",
          }}
        >
          <InsertSlot beforeId={layoutNode.id} />
          {children.length === 0 ? (
            <DropZone id={`drop-${layoutNode.id}`} parentId={layoutNode.id} label="Drop widgets here" compact />
          ) : (
            children.map((child) => (
              <div key={child.id}>
                <InsertSlot beforeId={child.id} />
                <CanvasNode
                  node={child}
                  selectedId={selectedId}
                  viewport={viewport}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  setBlocks={setBlocks}
                />
              </div>
            ))
          )}
          <DropZone id={`drop-end-${layoutNode.id}`} parentId={layoutNode.id} compact />
        </div>
      );
    }

    return null;
  };

  return (
    <SortableCanvasBlock
      node={node}
      selected={selected}
      onSelect={() => onSelect(node.id)}
      onDelete={() => onDelete(node.id)}
      onDuplicate={() => onDuplicate(node.id)}
      renderChildren={isLayoutType(node.type) ? renderChildren : undefined}
    />
  );
}

export function RootDropZone({ empty }: { empty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "drop-root", data: { parentId: null, kind: "dropzone" } });
  if (!empty) return null;
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed p-16 text-center transition ${
        isOver ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-300 text-slate-400"
      }`}
    >
      Add a layout preset or blocks from the left panel.
    </div>
  );
}

export function collectIds(blocks: BlockNode[]): string[] {
  const ids: string[] = ["drop-root"];
  function walk(nodes: BlockNode[]) {
    for (const n of nodes) {
      ids.push(n.id);
      ids.push(`drop-${n.id}`);
      ids.push(`drop-end-${n.id}`);
      ids.push(`insert-before-${n.id}`);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(blocks);
  return ids;
}

export function findBlockLabel(blocks: BlockNode[], id: string): string {
  for (const b of blocks) {
    if (b.id === id) return getBlock(b.type)?.label ?? b.type;
    if (b.children) {
      const l = findBlockLabel(b.children, id);
      if (l) return l;
    }
  }
  return "";
}
