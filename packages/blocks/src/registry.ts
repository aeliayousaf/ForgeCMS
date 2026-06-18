import type { BlockType } from "@forgecms/shared";
import type { BlockDefinition } from "./types.js";
import { heroBlock, headingBlock, textBlock, buttonBlock, ctaBlock } from "./components/content.js";
import { imageBlock, galleryBlock, videoBlock } from "./components/media.js";
import {
  featuresBlock,
  testimonialsBlock,
  faqBlock,
  pricingBlock,
  blogFeedBlock,
} from "./components/sections.js";
import { contactFormBlock, newsletterFormBlock } from "./components/forms.js";
import { customHtmlBlock } from "./components/advanced.js";
import { sectionBlock, containerBlock, columnBlock } from "./components/layout.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const definitions: BlockDefinition<any>[] = [
  sectionBlock,
  containerBlock,
  columnBlock,
  heroBlock,
  headingBlock,
  textBlock,
  imageBlock,
  galleryBlock,
  videoBlock,
  buttonBlock,
  testimonialsBlock,
  faqBlock,
  pricingBlock,
  featuresBlock,
  contactFormBlock,
  newsletterFormBlock,
  blogFeedBlock,
  ctaBlock,
  customHtmlBlock,
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<BlockType, BlockDefinition<any>>();
for (const def of definitions) registry.set(def.type, def);

// Future plugin hook: allow runtime registration of new blocks.
export function registerBlock(def: BlockDefinition): void {
  registry.set(def.type, def);
}

export function getBlock(type: BlockType): BlockDefinition | undefined {
  return registry.get(type);
}

export function getAllBlocks(): BlockDefinition[] {
  return Array.from(registry.values());
}

export const blockRegistry = registry;
