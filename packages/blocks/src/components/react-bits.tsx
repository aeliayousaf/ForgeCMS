import { z } from "zod";
import type { BlockDefinition } from "../types.js";

const reactBitsSchema = z.object({
  slug: z.string().min(1),
  componentProps: z.record(z.unknown()).default({}),
});

type ReactBitsProps = z.infer<typeof reactBitsSchema>;

/** Placeholder — apps/web replaces this via registerBlock() with the live renderer. */
export const reactBitsBlock: BlockDefinition<ReactBitsProps> = {
  type: "reactBits",
  label: "React Bits",
  category: "advanced",
  icon: "Sparkles",
  schema: reactBitsSchema,
  defaultProps: { slug: "", componentProps: {} },
  editorFields: [],
  component: ({ props }) => (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        background: "#f1f5f9",
        borderRadius: 8,
        color: "#64748b",
      }}
    >
      React Bits: {props.slug || "not configured"}
    </div>
  ),
};
