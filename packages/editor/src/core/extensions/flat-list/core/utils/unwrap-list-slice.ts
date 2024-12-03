import { Slice } from "@tiptap/pm/model";

import { isListNode } from "./is-list-node";

/**
 * Reduce the open depth of a slice if it only contains a single list node. When
 * copying some text from a deep nested list node, we don't want to paste the
 * entire list structure into the document later.
 *
 * @internal
 */
export function unwrapListSlice(slice: Slice): Slice {
  while (
    slice.openStart >= 2 &&
    slice.openEnd >= 2 &&
    slice.content.childCount === 1 &&
    isListNode(slice.content.child(0))
  ) {
    slice = new Slice(slice.content.child(0).content, slice.openStart - 1, slice.openEnd - 1);
  }
  return slice;
}
