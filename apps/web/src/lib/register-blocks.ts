import { registerBlock } from "@forgecms/blocks";
import { reactBitsBlockDefinition } from "./react-bits/block-definition";

let registered = false;

/** Register web-specific React Bits block (overrides packages/blocks placeholder). */
export function registerWebBlocks() {
  if (registered) return;
  registerBlock(reactBitsBlockDefinition);
  registered = true;
}

registerWebBlocks();
