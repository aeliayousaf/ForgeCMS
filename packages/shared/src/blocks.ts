import { z } from "zod";

export const BLOCK_TYPES = [
  "section",
  "container",
  "column",
  "hero",
  "text",
  "heading",
  "image",
  "gallery",
  "video",
  "button",
  "testimonials",
  "faq",
  "pricing",
  "features",
  "contactForm",
  "newsletterForm",
  "blogFeed",
  "cta",
  "reactBits",
  "customHtml",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

const alignment = z.enum(["left", "center", "right"]);

const breakpointStyle = z
  .object({
    paddingY: z.string().optional(),
    paddingX: z.string().optional(),
    marginY: z.string().optional(),
    align: alignment.optional(),
    textColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    hidden: z.boolean().optional(),
  })
  .partial();

export const responsiveStylesSchema = z.object({
  base: breakpointStyle.optional(),
  sm: breakpointStyle.optional(),
  md: breakpointStyle.optional(),
  lg: breakpointStyle.optional(),
});

export type ResponsiveStyles = z.infer<typeof responsiveStylesSchema>;

export const blockNodeSchema: z.ZodType<BlockNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.enum(BLOCK_TYPES),
    props: z.record(z.unknown()),
    styles: responsiveStylesSchema.optional(),
    children: z.array(blockNodeSchema).optional(),
  }),
);

export interface BlockNode {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  styles?: ResponsiveStyles;
  children?: BlockNode[];
}

export const pageDocumentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(blockNodeSchema),
});

export type PageDocument = z.infer<typeof pageDocumentSchema>;

export const emptyPageDocument = (): PageDocument => ({
  version: 1,
  blocks: [],
});
