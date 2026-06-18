import type { CSSProperties } from "react";
import type { ResponsiveStyles } from "@forgecms/shared";

// Resolves the JSON style tokens into an inline style object + classes.
// Base styles always apply; for the MVP renderer we collapse to base/md.
export function resolveStyles(styles?: ResponsiveStyles): {
  className: string;
  style: CSSProperties;
  hidden: boolean;
} {
  const base = styles?.base ?? {};
  const md = styles?.md ?? {};
  const merged = { ...base, ...md };

  const style: CSSProperties = {};
  if (merged.paddingY) style.paddingTop = style.paddingBottom = merged.paddingY;
  if (merged.paddingX) style.paddingLeft = style.paddingRight = merged.paddingX;
  if (merged.marginY) style.marginTop = style.marginBottom = merged.marginY;
  if (merged.textColor) style.color = merged.textColor;
  if (merged.backgroundColor) style.backgroundColor = merged.backgroundColor;
  if (merged.fontSize) style.fontSize = merged.fontSize;
  if (merged.fontWeight) style.fontWeight = merged.fontWeight;
  if (merged.align) style.textAlign = merged.align;

  return {
    className: "",
    style,
    hidden: Boolean(base.hidden),
  };
}
