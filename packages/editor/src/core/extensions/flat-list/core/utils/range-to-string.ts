import { type NodeRange } from "@tiptap/pm/model";

import { cutByIndex } from "./cut-by-index";

/**
 * Return a debugging string that describes this range.
 *
 * @internal
 */
export function rangeToString(range: NodeRange): string {
  const { parent, startIndex, endIndex } = range;
  return cutByIndex(parent.content, startIndex, endIndex).toString();
}
