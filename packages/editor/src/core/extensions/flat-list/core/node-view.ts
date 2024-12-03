import { type Node as ProsemirrorNode, DOMSerializer } from "@tiptap/pm/model";
import { type NodeViewConstructor } from "@tiptap/pm/view";

import * as browser from "./utils/browser";

/**
 * A simple node view that is used to render the list node. It ensures that the
 * list node get updated when its marker styling should changes.
 *
 * @public @group Plugins
 */
export const createListNodeView: NodeViewConstructor = (node) => {
  let prevNode = node;
  const prevNested = node.firstChild?.type === node.type;
  const prevSingleChild = node.childCount === 1;

  const spec = node.type.spec.toDOM!(node);
  const { dom, contentDOM } = DOMSerializer.renderSpec(document, spec);

  // iOS Safari will jump the text selection around with a toggle list since the element is empty,
  // and adding an empty span as a child to the click target prevents that behavior
  // See https://github.com/ocavue/prosemirror-flat-list/issues/89
  if (browser.safari && node.attrs.kind === "toggle") {
    (dom as HTMLElement).querySelector(".list-marker-click-target")?.appendChild(document.createElement("span"));
  }

  const update = (node: ProsemirrorNode): boolean => {
    if (!node.sameMarkup(prevNode)) return false;
    const nested = node.firstChild?.type === node.type;
    const singleChild = node.childCount === 1;
    if (prevNested !== nested || prevSingleChild !== singleChild) return false;
    prevNode = node;
    return true;
  };

  return { dom, contentDOM, update };
};
