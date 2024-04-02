import { Editor, isAtStartOfNode, isNodeActive } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

import { findListItemPos } from "src/ui/extensions/custom-list-keymap/list-helpers/find-list-item-pos";
import { hasListBefore } from "src/ui/extensions/custom-list-keymap/list-helpers/has-list-before";

import { hasListItemBefore } from "src/ui/extensions/custom-list-keymap/list-helpers/has-list-item-before";
import { listItemHasSubList } from "src/ui/extensions/custom-list-keymap/list-helpers/list-item-has-sub-list";
import { isCurrentParagraphASibling } from "src/ui/extensions/custom-list-keymap/list-helpers/is-para-sibling";
import { nextListIsSibling } from "src/ui/extensions/custom-list-keymap/list-helpers/next-list-is-sibling";
import { prevListIsHigher } from "src/ui/extensions/custom-list-keymap/list-helpers/prev-list-is-higher";

export const handleBackspace = (editor: Editor, name: string, parentListTypes: string[]) => {
  // this is required to still handle the undo handling
  if (editor.commands.undoInputRule()) {
    return true;
  }
  // Check if a node range is selected, and if so, fall back to default backspace functionality
  const { from, to } = editor.state.selection;
  if (from !== to) {
    // A range is selected, not just a cursor position; fall back to default behavior
    return false; // Let the editor handle backspace by default
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

    // Check if positions are within the valid range
    const startPos = $anchor.start() - 1;
    const endPos = $anchor.end() + 1;
    if (startPos < 0 || endPos > editor.state.doc.content.size) {
      return false; // Invalid position, abort operation
    }

    return editor.chain().cut({ from: startPos, to: endPos }, $lastItemPos.end()).joinForward().run();
  }

  // if the cursor is not inside the current node type
  // do nothing and proceed
  if (!isNodeActive(editor.state, name)) {
    return false;
  }

  // if the cursor is not at the start of a node
  // do nothing and proceed
  if (!isAtStartOfNode(editor.state)) {
    return false;
  }
  const isParaSibling = isCurrentParagraphASibling(editor.state);
  const isCurrentListItemSublist = prevListIsHigher(name, editor.state);
  const listItemPos = findListItemPos(name, editor.state);
  const nextListItemIsSibling = nextListIsSibling(name, editor.state);

  if (!listItemPos) {
    return false;
  }

  const currentNode = listItemPos.$pos.node(listItemPos.depth);
  const currentListItemHasSubList = listItemHasSubList(name, editor.state, currentNode);

  if (currentListItemHasSubList && isCurrentListItemSublist && isParaSibling) {
    return false;
  }

  if (currentListItemHasSubList && isCurrentListItemSublist) {
    editor.chain().liftListItem(name).run();
    return editor.commands.joinItemBackward();
  }

  if (isCurrentListItemSublist && nextListItemIsSibling) {
    return false;
  }

  if (isCurrentListItemSublist) {
    return false;
  }

  if (currentListItemHasSubList) {
    return false;
  }

  if (hasListItemBefore(name, editor.state)) {
    return editor.chain().liftListItem(name).run();
  }

  if (!currentListItemHasSubList) {
    return false;
  }

  // otherwise in the end, a backspace should
  // always just lift the list item if
  // joining / merging is not possible
  return editor.chain().liftListItem(name).run();
};
