import type { BlockNode } from "@forgecms/shared";

export const GRID_UNITS = 12;

/** Single-column width presets (12-column grid). */
export const COLUMN_WIDTH_PRESETS = [
  { label: "1/12", units: 1 },
  { label: "1/6", units: 2 },
  { label: "1/4", units: 3 },
  { label: "1/3", units: 4 },
  { label: "5/12", units: 5 },
  { label: "1/2", units: 6 },
  { label: "7/12", units: 7 },
  { label: "2/3", units: 8 },
  { label: "3/4", units: 9 },
  { label: "5/6", units: 10 },
  { label: "11/12", units: 11 },
  { label: "1/1", units: 12 },
] as const;

/** Row layout presets keyed by column count — weights are relative, not percents. */
export const ROW_LAYOUT_PRESETS: Record<number, { label: string; weights: number[] }[]> = {
  1: [{ label: "1/1", weights: [1] }],
  2: [
    { label: "1/2 · 1/2", weights: [1, 1] },
    { label: "1/3 · 2/3", weights: [1, 2] },
    { label: "2/3 · 1/3", weights: [2, 1] },
    { label: "1/4 · 3/4", weights: [1, 3] },
    { label: "3/4 · 1/4", weights: [3, 1] },
  ],
  3: [
    { label: "1/3 · 1/3 · 1/3", weights: [1, 1, 1] },
    { label: "1/4 · 1/4 · 1/2", weights: [1, 1, 2] },
    { label: "1/4 · 1/2 · 1/4", weights: [1, 2, 1] },
    { label: "1/2 · 1/4 · 1/4", weights: [2, 1, 1] },
    { label: "1/6 · 1/3 · 1/2", weights: [1, 2, 3] },
  ],
  4: [
    { label: "1/4 · 1/4 · 1/4 · 1/4", weights: [1, 1, 1, 1] },
    { label: "1/6 · 1/6 · 1/3 · 1/3", weights: [1, 1, 2, 2] },
    { label: "1/2 · 1/6 · 1/6 · 1/6", weights: [3, 1, 1, 1] },
  ],
};

export function unitsToPercent(units: number): number {
  return Math.round((units / GRID_UNITS) * 100);
}

export function percentToUnits(percent: number): number {
  return Math.round((percent / 100) * GRID_UNITS);
}

export function snapPercentToGrid(percent: number): number {
  const units = Math.min(GRID_UNITS, Math.max(1, percentToUnits(percent)));
  return unitsToPercent(units);
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/** Human-readable fraction for a width on the 12-column grid (e.g. 50 → "1/2"). */
export function percentToFractionLabel(percent: number): string {
  const units = percentToUnits(percent);
  if (units >= GRID_UNITS) return "1/1";
  if (units <= 0) return "—";
  const g = gcd(units, GRID_UNITS);
  return `${units / g}/${GRID_UNITS / g}`;
}

export function weightsToPercents(weights: number[]): number[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return weights.map(() => 100);
  const raw = weights.map((w) => (w / total) * 100);
  const snapped = raw.map((p) => snapPercentToGrid(p));
  const diff = 100 - snapped.reduce((a, b) => a + b, 0);
  if (snapped.length > 0) snapped[0] += diff;
  return snapped;
}

export function getContainerColumns(container: BlockNode): BlockNode[] {
  return (container.children ?? []).filter((c) => c.type === "column");
}

export function layoutMatchesPreset(
  columns: BlockNode[],
  weights: number[],
  widthKey: "widthPercent" | "widthPercentMd" | "widthPercentSm",
): boolean {
  if (columns.length !== weights.length) return false;
  const expected = weightsToPercents(weights);
  return columns.every((col, i) => {
    const w = Number(col.props[widthKey] ?? col.props.widthPercent ?? 50);
    return w === expected[i];
  });
}
