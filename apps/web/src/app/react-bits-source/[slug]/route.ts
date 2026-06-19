import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { getReactBitsEntry } from "@/lib/react-bits/manifest";

function resolveSourcePath(sourceFile: string): string | null {
  const cwd = process.cwd();
  const candidates = [
    join(cwd, "src/components", sourceFile),
    join(cwd, "apps/web/src/components", sourceFile),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getReactBitsEntry(slug);
  if (!entry?.sourceFile) {
    return Response.json({ error: "Component not found" }, { status: 404 });
  }

  const filePath = resolveSourcePath(entry.sourceFile);
  if (!filePath) {
    return Response.json({ error: "Source file not available on server" }, { status: 404 });
  }

  try {
    const source = readFileSync(filePath, "utf8");
    return Response.json({
      source,
      path: `apps/web/src/components/${entry.sourceFile}`,
      title: entry.title,
    });
  } catch {
    return Response.json({ error: "Failed to read source" }, { status: 500 });
  }
}
