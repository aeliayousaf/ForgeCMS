/**
 * Extracts editable prop fields from installed React Bits component source files.
 */
import fs from "node:fs";
import path from "node:path";

const SKIP_KEYS = new Set([
  "className",
  "style",
  "children",
  "container",
  "ref",
  "as",
  "id",
  "key",
  "imageSrc",
  "frontImage",
  "backImage",
  "lanyardImage",
  "modelUrl",
  "src",
  "href",
]);

const SKIP_KEY_PREFIXES = ["on"];

function humanLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function shouldSkipKey(key, type) {
  if (SKIP_KEYS.has(key)) return true;
  if (SKIP_KEY_PREFIXES.some((p) => key.startsWith(p))) return true;
  if (/Complete$|Callback$|Handler$|Ref$/.test(key)) return true;
  if (/ReactNode|ReactElement|Element|string \| null|HTMLAttributes|ThreeEvent|RigidBody|ComponentType|FC<|Promise|MouseEvent|TouchEvent/.test(type)) {
    return true;
  }
  if (/Record<|Map<|object|\(\)|=>/.test(type)) return true;
  return false;
}

function parseEnumOptions(type) {
  const literals = [...type.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  if (literals.length < 2) return null;
  const unique = [...new Set(literals)];
  if (unique.length < 2) return null;
  return unique.map((value) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " "),
    value,
  }));
}

function fieldForProp(key, rawType) {
  const type = rawType.replace(/\s+/g, " ").trim();

  if (shouldSkipKey(key, type)) return null;

  const enumOptions = parseEnumOptions(type);
  if (enumOptions) {
    return { key, label: humanLabel(key), type: "select", options: enumOptions };
  }

  if (type === "boolean" || type.startsWith("boolean")) {
    return { key, label: humanLabel(key), type: "boolean" };
  }

  if (type === "number" || type.startsWith("number")) {
    const field = { key, label: humanLabel(key), type: "number" };
    if (/^(opacity|intensity|blend|threshold|amplitude|scale|initialOpacity)$/i.test(key)) {
      field.min = 0;
      field.max = 1;
      field.step = 0.05;
    } else if (/^(duration|delay|disappearDuration|stepDuration|animationSpeed|speed|time|distance|disappearAfter)$/i.test(key)) {
      field.min = 0;
      field.step = /duration|delay/i.test(key) ? 50 : 1;
    }
    return field;
  }

  if (type.includes("[]") || type.startsWith("Array<") || type.startsWith("ReadonlyArray<")) {
    if (/color|colour|stop|gradient|palette|ray/i.test(key)) {
      return { key, label: humanLabel(key), type: "colors" };
    }
    return null;
  }

  if (type === "string" || type.startsWith("string") || /^['"]/.test(type)) {
    if (/colorStops|^colors$|rayColor|gradientStops|palette/i.test(key)) {
      return { key, label: humanLabel(key), type: "colors" };
    }
    if (/color|colour|fill|stroke|tint|hex/i.test(key)) {
      return { key, label: humanLabel(key), type: "color" };
    }
    return { key, label: humanLabel(key), type: "text", placeholder: key === "text" ? "Hello World" : undefined };
  }

  return null;
}

function extractPropsBlock(source) {
  const patterns = [
    /(?:export\s+)?(?:interface|type)\s+\w*Props\w*\s*(?:=\s*)?\{([\s\S]*?)\n\}/,
    /(?:export\s+)?(?:interface|type)\s+\w*Props\w*\s+extends[^{]+\{([\s\S]*?)\n\}/,
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function parsePropLines(block) {
  const fields = [];
  const seen = new Set();
  const lineRe = /^\s*(\w+)\??\s*:\s*([^;]+);/gm;
  let m;
  while ((m = lineRe.exec(block)) !== null) {
    const [, key, rawType] = m;
    if (seen.has(key)) continue;
    const field = fieldForProp(key, rawType);
    if (field) {
      seen.add(key);
      fields.push(field);
    }
  }
  return fields;
}

const FIELD_ORDER = ["text", "label", "title", "subtitle", "content", "placeholder"];

function sortFields(fields) {
  const rank = (key) => {
    const idx = FIELD_ORDER.indexOf(key);
    if (idx >= 0) return idx;
    if (/text|label|title|content/i.test(key)) return 1;
    if (/color/i.test(key)) return 2;
    if (/duration|delay|speed|threshold/i.test(key)) return 3;
    return 10;
  };
  return fields.sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
}

export function extractPropSchemaFromSource(source) {
  const block = extractPropsBlock(source);
  if (!block) return [];
  return sortFields(parsePropLines(block)).slice(0, 12);
}

export function extractPropSchemaFromFile(filePath) {
  try {
    const source = fs.readFileSync(filePath, "utf8");
    return extractPropSchemaFromSource(source);
  } catch {
    return [];
  }
}

export function resolveComponentFilePath(componentsDir, title) {
  const flat = path.join(componentsDir, `${title}.tsx`);
  if (fs.existsSync(flat)) return flat;
  return null;
}

export function extractPropSchemaForComponent(componentsDir, title) {
  const filePath = resolveComponentFilePath(componentsDir, title);
  if (!filePath) return [];
  return extractPropSchemaFromFile(filePath);
}
