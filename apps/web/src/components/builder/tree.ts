import type { BlockNode, BlockType } from "@forgecms/shared";

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

export function resizeColumns(
  blocks: BlockNode[],
  containerId: string,
  leftColumnId: string,
  rightColumnId: string,
  deltaPercent: number,
): BlockNode[] {
  return updateTree(blocks, containerId, (container) => {
    if (!container.children) return container;
    const children = container.children.map((col) => ({ ...col, props: { ...col.props } }));
    const left = children.find((c) => c.id === leftColumnId);
    const right = children.find((c) => c.id === rightColumnId);
    if (!left || !right) return container;

    const leftW = Number(left.props.widthPercent ?? 50);
    const rightW = Number(right.props.widthPercent ?? 50);
    const nextLeft = Math.min(90, Math.max(10, leftW + deltaPercent));
    const nextRight = Math.min(90, Math.max(10, rightW - deltaPercent));

    left.props = { ...left.props, widthPercent: nextLeft };
    right.props = { ...right.props, widthPercent: nextRight };
    return { ...container, children };
  });
}
