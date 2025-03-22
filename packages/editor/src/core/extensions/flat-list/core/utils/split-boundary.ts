import { type Transaction } from "@tiptap/pm/state";

/**
 * Split the node at the given position, and optionally, if `depth` is greater
 * than one, any number of nodes above that. Unlike `tr.split`, this function
 * will skip if the position is already at the boundary of a node. This will
 * avoid creating empty nodes during the split.
 */
export function splitBoundary(tr: Transaction, pos: number, depth = 1): void {
  if (depth <= 0) return;

  const $pos = tr.doc.resolve(pos);
  const parent = $pos.node();

  if (parent.isTextblock) {
    const parentOffset = $pos.parentOffset;
    if (parentOffset == 0) {
      return splitBoundary(tr, pos - 1, depth - 1);
    } else if (parentOffset >= parent.content.size) {
      return splitBoundary(tr, pos + 1, depth - 1);
    } else {
      tr.split(pos, depth);
    }
  } else {
    const index = $pos.index($pos.depth);
    if (index === 0) {
      return splitBoundary(tr, pos - 1, depth - 1);
    } else if (index === $pos.node().childCount) {
      return splitBoundary(tr, pos + 1, depth - 1);
    } else {
      tr.split(pos, depth);
    }
  }
}
