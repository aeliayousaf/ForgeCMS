import { Fragment } from "react";
import type { BlockNode, PageDocument } from "@forgecms/shared";
import { getBlock } from "./registry.js";
import { resolveStyles } from "./styles.js";

function RenderNode({ node }: { node: BlockNode }) {
  const def = getBlock(node.type);
  if (!def) {
    return (
      <div style={{ padding: "1rem", color: "#dc2626", textAlign: "center" }}>
        Unknown block: {node.type}
      </div>
    );
  }
  const { style, hidden } = resolveStyles(node.styles);
  if (hidden) return null;

  // Validate/normalize props against the block schema, falling back to defaults.
  const parsed = def.schema.safeParse({ ...def.defaultProps, ...node.props });
  const props = parsed.success ? parsed.data : def.defaultProps;
  const Component = def.component;

  return <Component props={props} style={style as Record<string, string>} />;
}

export function BlockRenderer({ document }: { document: PageDocument }) {
  return (
    <Fragment>
      {document.blocks.map((node) => (
        <RenderNode key={node.id} node={node} />
      ))}
    </Fragment>
  );
}
