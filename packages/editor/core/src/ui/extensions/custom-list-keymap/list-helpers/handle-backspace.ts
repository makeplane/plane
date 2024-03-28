import { Editor, isAtStartOfNode, isNodeActive } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

import { findListItemPos } from "src/ui/extensions/custom-list-keymap/list-helpers/find-list-item-pos";
import { hasListBefore } from "src/ui/extensions/custom-list-keymap/list-helpers/has-list-before";

import { hasListItemBefore } from "src/ui/extensions/custom-list-keymap/list-helpers/has-list-item-before";
import { listItemHasSubList } from "src/ui/extensions/custom-list-keymap/list-helpers/list-item-has-sub-list";
import { isCursorInSubList } from "./is-sublist";
import { nextListIsDeeper } from "./next-list-is-deeper";
import { prevListIsHigher } from "./prev-list-is-deeper";

export const handleBackspace = (editor: Editor, name: string, parentListTypes: string[]) => {
  // this is required to still handle the undo handling
  if (editor.commands.undoInputRule()) {
    return true;
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

  // if the cursor is not at the start of a node
  // do nothing and proceed
  if (!isAtStartOfNode(editor.state)) {
    return false;
  }

  const listItemPos = findListItemPos(name, editor.state);

  if (!listItemPos) {
    return false;
  }
  const currentNode = listItemPos.$pos.node(listItemPos.depth);
  const currentNodeSize = currentNode.nodeSize;
  const currentListItemHasSubList = listItemHasSubList(name, editor.state, currentNode);
  const isCurrentListItemSublist = prevListIsHigher(name, editor.state);
  // __AUTO_GENERATED_PRINT_VAR_START__
  console.log(
    "handleBackspace isCurrentListItemSublist: %s",
    isCurrentListItemSublist,
    hasListItemBefore(name, editor.state)
  ); // __AUTO_GENERATED_PRINT_VAR_END__
  // if the cursor is not at the start of a node
  // do nothing and proceed
  if (!isAtStartOfNode(editor.state)) {
    return false;
  }

  const $prev = editor.state.doc.resolve(listItemPos.$pos.pos - 2);
  const prevNode = $prev.node(listItemPos.depth);

  const previousListItemHasSubList = listItemHasSubList(name, editor.state, prevNode);
  // if the previous item is a list item and has a sublist, join the list items (this scenario only occurs when a sublist's first item is lifted)
  if (
    // hasListItemBefore(name, editor.state) &&
    // currentListItemHasSubList &&
    // currentNodeSize > 4 &&
    // !previousListItemHasSubList &&
    isCurrentListItemSublist
  ) {
    console.log("ran 0");
    editor.chain().liftListItem(name).run();
    return editor.commands.joinItemBackward();
    // return editor.chain().liftListItem(name).run();
  }

  // if the previous item is a list item and doesn't have a sublist, join the list items
  if (hasListItemBefore(name, editor.state)) {
    console.log("ran 1");
    return editor.chain().liftListItem(name).run();
  }

  console.log("ran 2");
  // otherwise in the end, a backspace should
  // always just lift the list item if
  // joining / merging is not possible
  return editor.chain().liftListItem(name).run();
};
