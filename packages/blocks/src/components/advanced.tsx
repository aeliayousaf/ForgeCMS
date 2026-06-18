import { z } from "zod";
import type { BlockDefinition } from "../types.js";

// ----- Custom HTML -----
// The HTML stored here is sanitized server-side (DOMPurify) before it is
// ever persisted, so rendering trusted-stored markup here is acceptable.
const customHtmlSchema = z.object({ html: z.string().default("") });
type CustomHtmlProps = z.infer<typeof customHtmlSchema>;

export const customHtmlBlock: BlockDefinition<CustomHtmlProps> = {
  type: "customHtml",
  label: "Custom HTML",
  category: "advanced",
  icon: "Code",
  schema: customHtmlSchema,
  defaultProps: { html: "<!-- Your sanitized HTML -->" },
  editorFields: [{ key: "html", label: "HTML", type: "textarea" }],
  component: ({ props, className, style }) => (
    <div
      className={className}
      style={{ maxWidth: 960, margin: "1rem auto", padding: "0 1.5rem", ...style }}
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  ),
};
