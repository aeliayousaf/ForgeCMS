"use client";

import { useDraggable } from "@dnd-kit/core";
import type { BlockType } from "@forgecms/shared";

export function PaletteDraggable({
  id,
  label,
  data,
  onClick,
  className,
}: {
  id: string;
  label: string;
  data: Record<string, unknown>;
  onClick?: () => void;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`cursor-grab touch-none rounded-lg border border-slate-200 px-2 py-2 text-xs active:cursor-grabbing hover:border-indigo-300 hover:bg-indigo-50 ${
        isDragging ? "opacity-40" : ""
      } ${className ?? ""}`}
      title={`Drag or click to add ${label}`}
    >
      {label}
    </button>
  );
}

export function paletteWidgetId(type: BlockType) {
  return `palette-widget-${type}`;
}

export function parsePaletteId(id: string): { kind: "widget"; type: BlockType } | { kind: "component"; componentId: string } | null {
  if (id.startsWith("palette-widget-")) {
    return { kind: "widget", type: id.slice("palette-widget-".length) as BlockType };
  }
  if (id.startsWith("palette-component-")) {
    return { kind: "component", componentId: id.slice("palette-component-".length) };
  }
  return null;
}
