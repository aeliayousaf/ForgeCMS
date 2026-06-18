import { z } from "zod";
import type { EditorField } from "./types.js";

export const layoutBackgroundSchema = z.object({
  backgroundImage: z.string().default(""),
  backgroundSize: z.enum(["cover", "contain", "stretch"]).default("cover"),
  backgroundPosition: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  backgroundScroll: z.enum(["static", "parallax"]).default("static"),
  backgroundOverlay: z.string().default("#000000"),
  backgroundOverlayOpacity: z.number().min(0).max(100).default(0),
});

export type LayoutBackgroundProps = z.infer<typeof layoutBackgroundSchema>;

export const layoutBackgroundDefaults: LayoutBackgroundProps = {
  backgroundImage: "",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundScroll: "static",
  backgroundOverlay: "#000000",
  backgroundOverlayOpacity: 0,
};

export function backgroundSizeToCss(size: LayoutBackgroundProps["backgroundSize"]): string {
  if (size === "contain") return "contain";
  if (size === "stretch") return "100% 100%";
  return "cover";
}

export function pickBackgroundProps(props: Record<string, unknown>): LayoutBackgroundProps {
  const parsed = layoutBackgroundSchema.safeParse(props);
  return parsed.success ? parsed.data : layoutBackgroundDefaults;
}

export const LAYOUT_BACKGROUND_EDITOR_FIELDS: EditorField[] = [
  { key: "backgroundImage", label: "Background image", type: "image", placeholder: "Image URL" },
  {
    key: "backgroundSize",
    label: "Image fit",
    type: "select",
    options: [
      { label: "Cover (fill area)", value: "cover" },
      { label: "Contain (fit image)", value: "contain" },
      { label: "Stretch (full width & height)", value: "stretch" },
    ],
  },
  {
    key: "backgroundPosition",
    label: "Image position",
    type: "select",
    options: [
      { label: "Center", value: "center" },
      { label: "Top", value: "top" },
      { label: "Bottom", value: "bottom" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
    ],
  },
  {
    key: "backgroundScroll",
    label: "Scroll effect",
    type: "select",
    options: [
      { label: "Static", value: "static" },
      { label: "Parallax", value: "parallax" },
    ],
  },
  { key: "backgroundOverlay", label: "Overlay color", type: "color" },
  { key: "backgroundOverlayOpacity", label: "Overlay opacity (%)", type: "number" },
];
