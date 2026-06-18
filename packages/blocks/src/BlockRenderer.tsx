import { Fragment, type ReactNode } from "react";
import type { BlockNode, PageDocument } from "@forgecms/shared";
import { getBlock } from "./registry.js";
import { resolveStyles } from "./styles.js";

function RenderNode({ node }: { node: BlockNode }): ReactNode {
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

  const parsed = def.schema.safeParse({ ...def.defaultProps, ...node.props });
  const props = parsed.success ? parsed.data : def.defaultProps;
  const Component = def.component;
  const childNodes = node.children?.map((child) => <RenderNode key={child.id} node={child} />);

  return <Component props={props} style={style as Record<string, string>} children={childNodes} />;
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
