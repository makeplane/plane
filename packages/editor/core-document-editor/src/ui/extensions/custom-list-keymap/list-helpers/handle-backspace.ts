import { Editor, isAtStartOfNode, isNodeActive } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

import { findListItemPos } from "src/ui/extensions/custom-list-keymap/list-helpers/find-list-item-pos";
import { hasListBefore } from "src/ui/extensions/custom-list-keymap/list-helpers/has-list-before";

export const handleBackspace = (editor: Editor, name: string, parentListTypes: string[]) => {
  // this is required to still handle the undo handling
  if (editor.commands.undoInputRule()) {
    return true;
  }

  // if the cursor is not at the start of a node
  // do nothing and proceed
  if (!isAtStartOfNode(editor.state)) {
    return false;
  }

  // if the current item is NOT inside a list item &
  // the previous item is a list (orderedList or bulletList)
  // move the cursor into the list and delete the current item
  if (!isNodeActive(editor.state, name) && hasListBefore(editor.state, name, parentListTypes)) {
    const { $anchor } = editor.state.selection;

    const $listPos = editor.state.doc.resolve($anchor.before() - 1);

    const listDescendants: Array<{ node: Node; pos: number }> = [];

    $listPos.node().descendants((node, pos) => {
      if (node.type.name === name) {
        listDescendants.push({ node, pos });
      }
    });

    const lastItem = listDescendants.at(-1);

    if (!lastItem) {
      return false;
    }

    const $lastItemPos = editor.state.doc.resolve($listPos.start() + lastItem.pos + 1);

    return editor
      .chain()
      .cut({ from: $anchor.start() - 1, to: $anchor.end() + 1 }, $lastItemPos.end())
      .joinForward()
      .run();
  }

  // if the cursor is not inside the current node type
  // do nothing and proceed
  if (!isNodeActive(editor.state, name)) {
    return false;
  }

  const listItemPos = findListItemPos(name, editor.state);

  if (!listItemPos) {
    return false;
  }

  // if current node is a list item and cursor it at start of a list node,
  // simply lift the list item i.e. remove it as a list item (task/bullet/ordered)
  // irrespective of above node being a list or not
  return editor.chain().liftListItem(name).run();
};
