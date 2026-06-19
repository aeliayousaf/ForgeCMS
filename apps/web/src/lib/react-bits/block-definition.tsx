"use client";

import { z } from "zod";
import type { BlockDefinition } from "@forgecms/blocks";
import { ReactBitsRenderer } from "@/components/react-bits/ReactBitsRenderer";

const reactBitsSchema = z.object({
  slug: z.string().min(1),
  componentProps: z.record(z.unknown()).default({}),
});

type ReactBitsProps = z.infer<typeof reactBitsSchema>;

export const reactBitsBlockDefinition: BlockDefinition<ReactBitsProps> = {
  type: "reactBits",
  label: "React Bits",
  category: "advanced",
  icon: "Sparkles",
  schema: reactBitsSchema,
  defaultProps: { slug: "", componentProps: {} },
  editorFields: [],
  component: ({ props, style, children }) => (
    <ReactBitsRenderer
      slug={props.slug}
      componentProps={props.componentProps}
      style={style}
    >
      {children}
    </ReactBitsRenderer>
  ),
};
