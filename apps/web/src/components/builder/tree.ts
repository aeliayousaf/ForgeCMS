import type { BlockNode, BlockType } from "@forgecms/shared";
import { snapPercentToGrid } from "./column-layout";

export type TreePath = number[];

const LAYOUT_TYPES = new Set<BlockType>(["section", "container", "column"]);

export function isLayoutType(type: BlockType): boolean {
  return LAYOUT_TYPES.has(type);
}

export function findNode(
  blocks: BlockNode[],
  id: string,
): { node: BlockNode; path: TreePath; parent: BlockNode[] } | null {
  function walk(nodes: BlockNode[], path: TreePath): { node: BlockNode; path: TreePath; parent: BlockNode[] } | null {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.id === id) return { node, path: [...path, i], parent: nodes };
      if (node.children?.length) {
        const found = walk(node.children, [...path, i]);
        if (found) return found;
      }
    }
    return null;
  }
  return walk(blocks, []);
}

export function getNodeAtPath(blocks: BlockNode[], path: TreePath): BlockNode | null {
  let current: BlockNode[] = blocks;
  let node: BlockNode | null = null;
  for (const idx of path) {
    node = current[idx] ?? null;
    if (!node) return null;
    current = node.children ?? [];
  }
  return node;
}

export function updateTree(blocks: BlockNode[], id: string, updater: (node: BlockNode) => BlockNode): BlockNode[] {
  return blocks.map((node) => {
    if (node.id === id) return updater(node);
    if (node.children?.length) {
      return { ...node, children: updateTree(node.children, id, updater) };
    }
    return node;
  });
}

export function removeNode(blocks: BlockNode[], id: string): BlockNode[] {
  return blocks
    .filter((n) => n.id !== id)
    .map((n) => (n.children?.length ? { ...n, children: removeNode(n.children, id) } : n));
}

export function insertNode(blocks: BlockNode[], parentId: string | null, node: BlockNode, index?: number): BlockNode[] {
  if (parentId === null) {
    const i = index ?? blocks.length;
    return [...blocks.slice(0, i), node, ...blocks.slice(i)];
  }
  return updateTree(blocks, parentId, (parent) => {
    const children = [...(parent.children ?? [])];
    const i = index ?? children.length;
    children.splice(i, 0, node);
    return { ...parent, children };
  });
}

export function moveNode(
  blocks: BlockNode[],
  activeId: string,
  overId: string,
  position: "before" | "after" | "inside",
): BlockNode[] {
  const found = findNode(blocks, activeId);
  if (!found) return blocks;

  const { node } = found;
  let next = removeNode(blocks, activeId);

  if (position === "inside") {
    return insertNode(next, overId, node);
  }

  const over = findNode(next, overId);
  if (!over) return blocks;

  const parentId = over.path.length > 1 ? getNodeAtPath(next, over.path.slice(0, -1))?.id ?? null : null;
  const parentList = parentId ? findNode(next, parentId)?.node.children ?? [] : next;
  const overIndex = parentList.findIndex((n) => n.id === overId);
  const insertIndex = position === "before" ? overIndex : overIndex + 1;

  if (parentId) {
    return insertNode(next, parentId, node, insertIndex);
  }
  return insertNode(next, null, node, insertIndex);
}

export function duplicateNode(blocks: BlockNode[], id: string, newId: () => string): BlockNode[] {
  const found = findNode(blocks, id);
  if (!found) return blocks;

  function clone(n: BlockNode): BlockNode {
    return {
      ...structuredClone(n),
      id: newId(),
      children: n.children?.map(clone),
    };
  }

  const copy = clone(found.node);
  const idx = found.path[found.path.length - 1];
  const parentId = found.path.length > 1 ? getNodeAtPath(blocks, found.path.slice(0, -1))?.id ?? null : null;
  return insertNode(blocks, parentId, copy, idx + 1);
}

/** Where new blocks from the palette should be inserted. */
export function resolveInsertTarget(
  blocks: BlockNode[],
  selectedId: string | null,
): { parentId: string | null; hint: string } {
  if (!selectedId) return { parentId: null, hint: "page root" };

  const found = findNode(blocks, selectedId);
  if (!found) return { parentId: null, hint: "page root" };

  const { node } = found;
  if (node.type === "column") return { parentId: node.id, hint: "inside selected column" };
  if (node.type === "container") return { parentId: node.id, hint: "inside container (add a column first for widgets)" };
  if (node.type === "section") return { parentId: node.id, hint: "inside section" };

  // Content block selected — insert as sibling in same parent
  if (found.path.length > 1) {
    const parentPath = found.path.slice(0, -1);
    const parent = getNodeAtPath(blocks, parentPath);
    if (parent) return { parentId: parent.id, hint: `next to ${node.type} in parent` };
  }
  return { parentId: null, hint: "page root" };
}

export function canAcceptChild(parentType: BlockType, childType: BlockType): boolean {
  if (parentType === "column") return !isLayoutType(childType);
  if (parentType === "container") return childType === "column";
  if (parentType === "section") return childType === "container" || childType === "section" || !isLayoutType(childType);
  return false;
}

export function getParentId(blocks: BlockNode[], id: string): string | null {
  const found = findNode(blocks, id);
  if (!found || found.path.length <= 1) return null;
  return getNodeAtPath(blocks, found.path.slice(0, -1))?.id ?? null;
}

export function cloneBlockTree(node: BlockNode, newId: () => string): BlockNode {
  return {
    ...structuredClone(node),
    id: newId(),
    children: node.children?.map((c) => cloneBlockTree(c, newId)),
  };
}

export function cloneBlockForest(nodes: BlockNode[], newId: () => string): BlockNode[] {
  return nodes.map((n) => cloneBlockTree(n, newId));
}

function containsNode(node: BlockNode, targetId: string): boolean {
  if (node.id === targetId) return true;
  return node.children?.some((c) => containsNode(c, targetId)) ?? false;
}

/** Resolve drag-drop target into parent + insert index. */
export function resolveDropTarget(
  blocks: BlockNode[],
  overId: string,
  overData?: { parentId?: string | null; kind?: string; insertIndex?: number },
): { parentId: string | null; index: number } | null {
  if (overData?.kind === "dropzone") {
    const parentId = overData.parentId ?? null;
    if (parentId) {
      const parent = findNode(blocks, parentId)?.node;
      const len = parent?.children?.length ?? 0;
      return { parentId, index: overData.insertIndex ?? len };
    }
    return { parentId: null, index: blocks.length };
  }

  if (overId.startsWith("drop-end-")) {
    const parentId = overId.slice("drop-end-".length);
    const parent = findNode(blocks, parentId)?.node;
    return { parentId, index: parent?.children?.length ?? 0 };
  }

  if (overId.startsWith("drop-") && overId !== "drop-root") {
    const parentId = overId.slice("drop-".length);
    if (parentId.startsWith("end-")) {
      const pid = parentId.slice("end-".length);
      const parent = findNode(blocks, pid)?.node;
      return { parentId: pid, index: parent?.children?.length ?? 0 };
    }
    const parent = findNode(blocks, parentId)?.node;
    return { parentId, index: parent?.children?.length ?? 0 };
  }

  if (overId === "drop-root") {
    return { parentId: null, index: blocks.length };
  }

  if (overId.startsWith("insert-before-")) {
    const targetId = overId.slice("insert-before-".length);
    const target = findNode(blocks, targetId);
    if (!target) return null;

    // Dropping before a layout node = insert at the start of its children
    if (isLayoutType(target.node.type)) {
      return { parentId: targetId, index: 0 };
    }

    const parentId = getParentId(blocks, targetId);
    const idx = target.path[target.path.length - 1];
    return { parentId, index: idx };
  }

  if (overId.startsWith("insert-after-")) {
    const targetId = overId.slice("insert-after-".length);
    const target = findNode(blocks, targetId);
    if (!target) return null;
    const parentId = getParentId(blocks, targetId);
    const idx = target.path[target.path.length - 1] + 1;
    return { parentId, index: idx };
  }

  // Dropped on a node: insert before it (same parent)
  const over = findNode(blocks, overId);
  if (!over) return null;

  if (over.node.type === "column" || over.node.type === "section" || over.node.type === "container") {
    return { parentId: overId, index: over.node.children?.length ?? 0 };
  }

  const parentId = getParentId(blocks, overId);
  const idx = over.path[over.path.length - 1];
  return { parentId, index: idx };
}

export function applyDragMove(blocks: BlockNode[], activeId: string, overId: string, overData?: { parentId?: string | null; kind?: string; insertIndex?: number }): BlockNode[] {
  const found = findNode(blocks, activeId);
  if (!found) return blocks;

  const target = resolveDropTarget(blocks, overId, overData);
  if (!target) return blocks;

  const node = found.node;
  // Cannot move a node into its own descendant
  if (target.parentId && containsNode(node, target.parentId)) return blocks;
  const bareOver = overId.replace(/^insert-before-|^insert-after-|^drop-end-|^drop-/, "");
  if (bareOver && bareOver !== activeId && containsNode(node, bareOver)) return blocks;

  let next = removeNode(blocks, activeId);

  // Adjust index if moving within same parent and removing shifted indices
  let { parentId, index } = target;
  const activeParentId = getParentId(blocks, activeId);
  const activeIdx = found.path[found.path.length - 1];
  if (activeParentId === parentId && activeIdx < index) {
    index -= 1;
  }

  if (parentId) {
    const parent = findNode(next, parentId)?.node;
    if (parent && !canAcceptChild(parent.type, node.type)) return blocks;
  }

  return insertNode(next, parentId, node, index);
}

export function resizeColumns(
  blocks: BlockNode[],
  containerId: string,
  leftColumnId: string,
  rightColumnId: string,
  deltaPercent: number,
  widthKey: "widthPercent" | "widthPercentMd" | "widthPercentSm" = "widthPercent",
): BlockNode[] {
  return updateTree(blocks, containerId, (container) => {
    if (!container.children) return container;
    const children = container.children.map((col) => ({ ...col, props: { ...col.props } }));
    const left = children.find((c) => c.id === leftColumnId);
    const right = children.find((c) => c.id === rightColumnId);
    if (!left || !right) return container;

    const minPct = 8; // 1/12 of the row
    const fallback = Number(left.props.widthPercent ?? 50);
    const leftW = Number(left.props[widthKey] ?? fallback);
    const rightW = Number(right.props[widthKey] ?? Number(right.props.widthPercent ?? 50));
    const pairTotal = leftW + rightW;

    let nextLeft = leftW + deltaPercent;
    nextLeft = Math.min(pairTotal - minPct, Math.max(minPct, nextLeft));
    nextLeft = snapPercentToGrid(nextLeft);
    nextLeft = Math.min(pairTotal - minPct, Math.max(minPct, nextLeft));
    const nextRight = pairTotal - nextLeft;

    left.props = { ...left.props, [widthKey]: nextLeft };
    right.props = { ...right.props, [widthKey]: nextRight };
    return { ...container, children };
  });
}

export function applyContainerColumnWidths(
  blocks: BlockNode[],
  containerId: string,
  percents: number[],
  widthKey: "widthPercent" | "widthPercentMd" | "widthPercentSm" = "widthPercent",
): BlockNode[] {
  return updateTree(blocks, containerId, (container) => {
    const columns = (container.children ?? []).filter((c) => c.type === "column");
    if (columns.length !== percents.length) return container;
    let colIdx = 0;
    return {
      ...container,
      children: (container.children ?? []).map((child) => {
        if (child.type !== "column") return child;
        const pct = percents[colIdx++] ?? child.props.widthPercent;
        return { ...child, props: { ...child.props, [widthKey]: pct } };
      }),
    };
  });
}
