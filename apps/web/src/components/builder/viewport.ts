export type BuilderViewport = "desktop" | "tablet" | "mobile";

export const VIEWPORT_WIDTHS: Record<BuilderViewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

export function getColumnWidthPercent(
  props: Record<string, unknown>,
  viewport: BuilderViewport,
): number {
  const base = Number(props.widthPercent ?? 50);
  const md = props.widthPercentMd != null ? Number(props.widthPercentMd) : base;
  const sm = props.widthPercentSm != null ? Number(props.widthPercentSm) : md;
  if (viewport === "mobile") return sm;
  if (viewport === "tablet") return md;
  return base;
}

export function columnWidthPropKey(viewport: BuilderViewport): "widthPercent" | "widthPercentMd" | "widthPercentSm" {
  if (viewport === "mobile") return "widthPercentSm";
  if (viewport === "tablet") return "widthPercentMd";
  return "widthPercent";
}

export function columnCssVarsFromProps(props: Record<string, unknown>): Record<string, string> {
  const w = Number(props.widthPercent ?? 50);
  const md = props.widthPercentMd != null ? Number(props.widthPercentMd) : w;
  const sm = props.widthPercentSm != null ? Number(props.widthPercentSm) : md;
  return {
    "--fc-col-w": `${w}%`,
    "--fc-col-w-md": `${md}%`,
    "--fc-col-w-sm": `${sm}%`,
  };
}
