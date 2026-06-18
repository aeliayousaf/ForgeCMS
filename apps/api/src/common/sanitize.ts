import DOMPurify from "isomorphic-dompurify";
import type { PageDocument } from "@forgecms/shared";

// Sanitizes any HTML-bearing block props before persistence. This is the
// single choke point that makes the Custom HTML and Text blocks XSS-safe.
const HTML_PROP_KEYS = new Set(["html"]);

export function sanitizeDocument(doc: PageDocument): PageDocument {
  return {
    version: 1,
    blocks: doc.blocks.map((block) => {
      const props = { ...block.props };
      for (const key of Object.keys(props)) {
        if (HTML_PROP_KEYS.has(key) && typeof props[key] === "string") {
          props[key] = DOMPurify.sanitize(props[key] as string, {
            ADD_ATTR: ["target", "rel"],
          });
        }
      }
      return { ...block, props };
    }),
  };
}
