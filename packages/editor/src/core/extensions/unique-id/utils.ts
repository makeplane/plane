import { findChildren } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";
// types
import type { UniqueIDOptions } from "./extension";

/**
 * Utility function to create IDs for nodes that don't have them
 */
export const createIdsForView = (view: EditorView, options: UniqueIDOptions) => {
  const { state } = view;
  const { tr, doc } = state;
  const { types, attributeName, generateUniqueID } = options;
  const nodesWithoutId = findChildren(
    doc,
    (node) => types.includes(node.type.name) && node.attrs[attributeName] === null
  );

  nodesWithoutId.forEach(({ node, pos }) => {
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      [attributeName]: generateUniqueID({ node, pos }),
    });
  });

  tr.setMeta("addToHistory", false);

  view.dispatch(tr);
};
