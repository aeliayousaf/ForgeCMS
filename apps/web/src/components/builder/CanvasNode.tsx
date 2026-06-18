"use client";

import { useCallback, useRef, type CSSProperties } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { BlockRenderer, getBlock } from "@forgecms/blocks";
import type { BlockNode } from "@forgecms/shared";
import { isLayoutType, resizeColumns } from "./tree";

function ColumnResizeHandle({
  containerId,
  leftId,
  rightId,
  onResize,
}: {
  containerId: string;
  leftId: string;
  rightId: string;
  onResize: (updater: (prev: BlockNode[]) => BlockNode[]) => void;
}) {
  const dragging = useRef(false);
  const startX = useRef(0);

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
        onResize((prev) => resizeColumns(prev, containerId, leftId, rightId, deltaPercent));
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [containerId, leftId, rightId, onResize],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      onMouseDown={onMouseDown}
      className="group/handle relative z-20 flex w-3 shrink-0 cursor-col-resize items-center justify-center"
    >
      <div className="h-10 w-1 rounded-full bg-indigo-400 opacity-0 transition group-hover/handle:opacity-100" />
    </div>
  );
}

function DropZone({
  id,
  parentId,
  label,
  active,
}: {
  id: string;
  parentId: string;
  label?: string;
  active?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { parentId, kind: "dropzone" } });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[48px] rounded-lg border-2 border-dashed transition ${
        isOver || active ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50/50"
      }`}
    >
      {label && <p className="p-2 text-center text-xs text-slate-400">{label}</p>}
    </div>
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
    data: { type: node.type },
  });
  const def = getBlock(node.type);
  const isLayout = isLayoutType(node.type);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`group relative ${isLayout ? "my-1" : ""} border-2 ${
        selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-transparent hover:border-indigo-200"
      }`}
    >
      <div className="absolute -left-3 top-2 z-30 flex flex-col gap-1 opacity-0 group-hover:opacity-100">
        <button type="button" {...attributes} {...listeners} className="cursor-grab rounded bg-slate-800 p-1 text-white">
          <GripVertical size={14} />
        </button>
      </div>
      <div className="absolute right-2 top-2 z-30 flex gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="rounded bg-slate-800 p-1 text-white"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded bg-red-600 p-1 text-white"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isLayout && renderChildren ? (
        renderChildren(node)
      ) : (
        <div className="pointer-events-none">
          {def ? (
            <BlockRenderer document={{ version: 1, blocks: [node] }} />
          ) : (
            <div className="p-4 text-red-500">Unknown: {node.type}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function CanvasNode({
  node,
  selectedId,
  onSelect,
  onDelete,
  onDuplicate,
  setBlocks,
}: {
  node: BlockNode;
  selectedId: string | null;
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
          {children.length === 0 ? (
            <DropZone id={`drop-${layoutNode.id}`} parentId={layoutNode.id} label="Drop container or blocks here" active={selected} />
          ) : (
            children.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                setBlocks={setBlocks}
              />
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
            <DropZone id={`drop-${layoutNode.id}`} parentId={layoutNode.id} label="Add columns or use a layout preset" active={selected} />
          ) : (
            columns.map((col, idx) => (
              <div
                key={col.id}
                style={{
                  display: "flex",
                  flex: `0 0 ${col.props.widthPercent ?? 50}%`,
                  maxWidth: `${col.props.widthPercent ?? 50}%`,
                  minWidth: 0,
                }}
              >
                <CanvasNode
                  node={col}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  setBlocks={setBlocks}
                />
                {idx < columns.length - 1 && selected && (
                  <ColumnResizeHandle
                    containerId={layoutNode.id}
                    leftId={col.id}
                    rightId={columns[idx + 1].id}
                    onResize={(updater) => setBlocks(updater)}
                  />
                )}
              </div>
            ))
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
            border: selected ? undefined : "1px dashed #cbd5e1",
            boxSizing: "border-box",
          }}
        >
          {children.length === 0 ? (
            <DropZone id={`drop-${layoutNode.id}`} parentId={layoutNode.id} label="Drop widgets here" active={selected} />
          ) : (
            children.map((child) => (
              <CanvasNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                setBlocks={setBlocks}
              />
            ))
          )}
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
        isOver ? "border-indigo-400 bg-indigo-50 text-indigo-600" : "border-slate-300 text-slate-400"
      }`}
    >
      Add a layout preset or blocks from the left panel.
    </div>
  );
}

export function collectIds(blocks: BlockNode[]): string[] {
  const ids: string[] = [];
  function walk(nodes: BlockNode[]) {
    for (const n of nodes) {
      ids.push(n.id);
      if (n.children?.length) walk(n.children);
    }
  }
  walk(blocks);
  return ids;
}
