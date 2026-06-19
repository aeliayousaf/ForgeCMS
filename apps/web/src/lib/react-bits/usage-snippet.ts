import type { ReactBitsManifestEntry } from "./manifest";

/** JSX usage snippet with current prop values (for the code panel). */
export function buildReactBitsUsageSnippet(
  entry: Pick<ReactBitsManifestEntry, "title">,
  componentProps: Record<string, unknown>,
): string {
  const importPath = `@/components/${entry.title}`;
  const lines = [`import ${entry.title} from "${importPath}";`, ""];

  const propEntries = Object.entries(componentProps).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );

  if (propEntries.length === 0) {
    lines.push(`<${entry.title} />`);
    return lines.join("\n");
  }

  if (propEntries.length === 1) {
    const [[k, v]] = propEntries;
    lines.push(`<${entry.title} ${formatProp(k, v)} />`);
    return lines.join("\n");
  }

  lines.push(`<${entry.title}`);
  for (const [k, v] of propEntries) {
    lines.push(`  ${formatProp(k, v)}`);
  }
  lines.push("/>");
  return lines.join("\n");
}

function formatProp(key: string, value: unknown): string {
  if (typeof value === "string") {
    return `${key}="${value.replace(/"/g, '\\"')}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `${key}={${String(value)}}`;
  }
  return `${key}={${JSON.stringify(value)}}`;
}
