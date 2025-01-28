import { NodeRange, type ResolvedPos } from "@tiptap/pm/model";

import { isListNode } from "./is-list-node";

/**
 * Returns a minimal block range that includes the given two positions and
 * represents one or multiple sibling list nodes.
 *
 * @public
 */
export function findListsRange($from: ResolvedPos, $to: ResolvedPos = $from): NodeRange | null {
  if ($to.pos < $from.pos) {
    return findListsRange($to, $from);
  }

  let range = $from.blockRange($to);

  while (range) {
    if (isListsRange(range)) {
      return range;
    }

    if (range.depth <= 0) {
      break;
    }

    range = new NodeRange($from, $to, range.depth - 1);
  }

  return null;
}

/** @internal */
export function isListsRange(range: NodeRange): boolean {
  const { startIndex, endIndex, parent } = range;

  for (let i = startIndex; i < endIndex; i++) {
    if (!isListNode(parent.child(i))) {
      return false;
    }
  }

  return true;
}
