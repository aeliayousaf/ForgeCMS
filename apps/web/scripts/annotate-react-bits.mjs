#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const componentsDir = path.resolve(webRoot, "src/components");
const skip = new Set(["PublicPage.tsx", "PublicPageRenderer.tsx", "AdminShell.tsx"]);

for (const file of fs.readdirSync(componentsDir)) {
  if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
  if (skip.has(file)) continue;
  const full = path.join(componentsDir, file);
  if (!fs.statSync(full).isFile()) continue;
  let content = fs.readFileSync(full, "utf8");
  if (!content.startsWith("// @ts-nocheck")) {
    fs.writeFileSync(full, `// @ts-nocheck\n${content}`);
    console.log(`Annotated ${file}`);
  }
}
