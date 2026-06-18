import { z } from "zod";
import type { BlockDefinition } from "../types.js";

const sectionSchema = z.object({
  fullWidth: z.boolean().default(true),
  maxWidth: z.string().default("1200px"),
  paddingY: z.string().default("3rem"),
  paddingX: z.string().default("1.5rem"),
  backgroundColor: z.string().default(""),
});
type SectionProps = z.infer<typeof sectionSchema>;

export const sectionBlock: BlockDefinition<SectionProps> = {
  type: "section",
  label: "Section",
  category: "layout",
  icon: "LayoutTemplate",
  schema: sectionSchema,
  defaultProps: {
    fullWidth: true,
    maxWidth: "1200px",
    paddingY: "3rem",
    paddingX: "1.5rem",
    backgroundColor: "",
  },
  editorFields: [
    { key: "fullWidth", label: "Full width content", type: "boolean" },
    { key: "maxWidth", label: "Max width", type: "text" },
    { key: "paddingY", label: "Vertical padding", type: "text" },
    { key: "paddingX", label: "Horizontal padding", type: "text" },
    { key: "backgroundColor", label: "Background color", type: "color" },
  ],
  component: ({ props, style, children }) => {
    const inner = (
      <div style={{ width: "100%", maxWidth: props.fullWidth ? undefined : props.maxWidth, margin: "0 auto" }}>
        {children}
      </div>
    );
    return (
      <section
        style={{
          width: "100%",
          paddingTop: props.paddingY,
          paddingBottom: props.paddingY,
          paddingLeft: props.paddingX,
          paddingRight: props.paddingX,
          backgroundColor: props.backgroundColor || undefined,
          ...style,
        }}
      >
        {props.fullWidth ? children : inner}
      </section>
    );
  },
};

const containerSchema = z.object({
  gap: z.string().default("1.5rem"),
  align: z.enum(["stretch", "center", "flex-start", "flex-end"]).default("stretch"),
  justify: z.enum(["flex-start", "center", "flex-end", "space-between"]).default("flex-start"),
  direction: z.enum(["row", "column"]).default("row"),
  wrap: z.boolean().default(false),
});
type ContainerProps = z.infer<typeof containerSchema>;

export const containerBlock: BlockDefinition<ContainerProps> = {
  type: "container",
  label: "Container",
  category: "layout",
  icon: "Columns",
  schema: containerSchema,
  defaultProps: {
    gap: "1.5rem",
    align: "stretch",
    justify: "flex-start",
    direction: "row",
    wrap: false,
  },
  editorFields: [
    { key: "gap", label: "Column gap", type: "text" },
    {
      key: "direction",
      label: "Direction",
      type: "select",
      options: [
        { label: "Row (columns)", value: "row" },
        { label: "Column (stacked)", value: "column" },
      ],
    },
    {
      key: "align",
      label: "Align items",
      type: "select",
      options: [
        { label: "Stretch", value: "stretch" },
        { label: "Center", value: "center" },
        { label: "Start", value: "flex-start" },
        { label: "End", value: "flex-end" },
      ],
    },
    {
      key: "justify",
      label: "Justify",
      type: "select",
      options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Space between", value: "space-between" },
      ],
    },
    { key: "wrap", label: "Wrap columns", type: "boolean" },
  ],
  component: ({ props, style, children }) => (
    <div
      style={{
        display: "flex",
        flexDirection: props.direction,
        flexWrap: props.wrap ? "wrap" : "nowrap",
        gap: props.gap,
        alignItems: props.align,
        justifyContent: props.justify,
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  ),
};

const columnSchema = z.object({
  widthPercent: z.number().min(5).max(100).default(50),
  widthPercentMd: z.number().min(5).max(100).optional(),
  widthPercentSm: z.number().min(5).max(100).optional(),
  minHeight: z.string().default("80px"),
  padding: z.string().default("0.5rem"),
  backgroundColor: z.string().default(""),
});
type ColumnProps = z.infer<typeof columnSchema>;

function columnCssVars(props: ColumnProps): Record<string, string> {
  const w = `${props.widthPercent}%`;
  const md = `${props.widthPercentMd ?? props.widthPercent}%`;
  const sm = `${props.widthPercentSm ?? props.widthPercentMd ?? props.widthPercent}%`;
  return { "--fc-col-w": w, "--fc-col-w-md": md, "--fc-col-w-sm": sm };
}

export const columnBlock: BlockDefinition<ColumnProps> = {
  type: "column",
  label: "Column",
  category: "layout",
  icon: "Square",
  schema: columnSchema,
  defaultProps: {
    widthPercent: 50,
    widthPercentMd: undefined,
    widthPercentSm: undefined,
    minHeight: "80px",
    padding: "0.5rem",
    backgroundColor: "",
  },
  editorFields: [
    { key: "widthPercent", label: "Width desktop (%)", type: "number" },
    { key: "widthPercentMd", label: "Width tablet (%)", type: "number" },
    { key: "widthPercentSm", label: "Width mobile (%)", type: "number" },
    { key: "minHeight", label: "Min height", type: "text" },
    { key: "padding", label: "Padding", type: "text" },
    { key: "backgroundColor", label: "Background", type: "color" },
  ],
  component: ({ props, style, children }) => (
    <div
      className="fc-column"
      style={{
        ...columnCssVars(props),
        minHeight: props.minHeight,
        padding: props.padding,
        backgroundColor: props.backgroundColor || undefined,
        ...style,
      }}
    >
      {children}
    </div>
  ),
};

/** Preset: section → container → N equal columns */
export function createColumnLayout(count: 2 | 3 | 4, newId: () => string) {
  const width = Math.floor(100 / count);
  const remainder = 100 - width * count;
  const widths = Array.from({ length: count }, (_, i) => width + (i === 0 ? remainder : 0));

  return {
    id: newId(),
    type: "section" as const,
    props: { fullWidth: true, maxWidth: "1200px", paddingY: "2rem", paddingX: "1.5rem", backgroundColor: "" },
    children: [
      {
        id: newId(),
        type: "container" as const,
        props: { gap: "1.5rem", align: "stretch", justify: "flex-start", direction: "row", wrap: false },
        children: widths.map((w) => ({
          id: newId(),
          type: "column" as const,
          props: { widthPercent: w, minHeight: "120px", padding: "0.5rem", backgroundColor: "" },
          children: [],
        })),
      },
    ],
  };
}
