#!/usr/bin/env node
/**
 * Regenerates packages/shared/react-bits.catalog.json from the React Bits registry.
 * Keeps only *-TS-TW variants (one per component title).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.resolve(__dirname, "../../../packages/shared/react-bits.catalog.json");
const REGISTRY_URL = "https://reactbits.dev/r/registry.json";

const BACKGROUND_KEYWORDS =
  /aurora|background|beam|dither|distortion|grid|particle|plasma|prism|ripple|shader|silk|thread|wave|noise|lightning|light.?ray|terminal|ballpit|metaball|pixel|hyperspeed|iridescence|dot.?grid|faulty|blob|fluid|smoke|starfield|galaxy|nebula|fog|rain|snow|fire|canvas|webgl|three/i;

const TEXT_KEYWORDS = /text|typewriter|count.?up|counter|letter|word|heading|title|glitch.?text|gradient.?text|shiny|split|blur.?text|decrypt|rotating|scramble|textify/i;

const ANIMATION_KEYWORDS =
  /fade|animate|scroll|reveal|float|blur|motion|transition|stagger|spring|bounce|slide|flip|rotate|scale|parallax|morph|gradual/i;

const INTERACTIVE_KEYWORDS =
  /cursor|magnet|hover|click|card|carousel|dock|masonry|tilt|drag|spotlight|glare|border|spark|button|menu|nav|tab|accordion|modal|tooltip|slider|toggle|switch|input|form|dock|wheel|orbit|follow|pointer|mouse|touch|interactive|decay|electric|star.?border|bounce.?card/i;

function categorize(title, description) {
  const hay = `${title} ${description}`;
  if (BACKGROUND_KEYWORDS.test(hay)) return "background";
  if (TEXT_KEYWORDS.test(title) || (TEXT_KEYWORDS.test(hay) && !INTERACTIVE_KEYWORDS.test(title))) return "text";
  if (ANIMATION_KEYWORDS.test(hay)) return "animation";
  if (INTERACTIVE_KEYWORDS.test(hay)) return "interactive";
  return "other";
}

function supportsChildren(title, description) {
  const hay = `${title} ${description}`.toLowerCase();
  if (/wrapper|wraps|children|child content|any children|nested|slot/i.test(hay)) return true;
  if (/FadeContent|AnimatedContent|ScrollReveal|ScrollFloat|GradualBlur|Magnet|GlareHover|StarBorder|ElectricBorder|DecayCard/i.test(title)) {
    return true;
  }
  return false;
}

async function main() {
  const res = await fetch(REGISTRY_URL);
  if (!res.ok) throw new Error(`Registry fetch failed: ${res.status}`);
  const data = await res.json();

  const byTitle = new Map();
  for (const item of data.items ?? []) {
    if (!item.name?.endsWith("-TS-TW")) continue;
    const title = item.title ?? item.name.replace(/-TS-TW$/, "");
    if (!byTitle.has(title)) byTitle.set(title, item);
  }

  const components = [...byTitle.values()]
    .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))
    .map((item) => {
      const title = item.title ?? item.name.replace(/-TS-TW$/, "");
      const entry = {
        slug: item.name,
        category: categorize(title, item.description ?? ""),
      };
      if (supportsChildren(title, item.description ?? "")) {
        entry.supportsChildren = true;
      }
      return entry;
    });

  const catalog = { variant: "TS-TW", components };
  fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`✓ Wrote ${components.length} components → ${catalogPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
