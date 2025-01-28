import { NodeRange, type ResolvedPos } from "@tiptap/pm/model";
import { TextSelection, type Command, type EditorState, type Transaction } from "@tiptap/pm/state";

import { atTextblockStart } from "../utils/at-textblock-start";
import { isListNode } from "../utils/is-list-node";
import { safeLift } from "../utils/safe-lift";

/**
 * If the text cursor is at the start of the first child of a list node, lift
 * all content inside the list. If the text cursor is at the start of the last
 * child of a list node, lift this child.
 *
 * @public @group Commands
 */
export const joinListUp: Command = (state, dispatch, view) => {
  const $cursor = atTextblockStart(state, view);

  if (!$cursor) return false;

  const before = $cursor.pos - 1;
  const $before = state.doc.resolve(before);
  const nodeBefore = $before.nodeBefore;

  // Handle case when there's a list node before
  if (
    nodeBefore?.type.name === "list" &&
    nodeBefore?.lastChild.isBlock &&
    !nodeBefore.lastChild.type.name.startsWith("paragraph")
  ) {
    if (dispatch) {
      const tr = state.tr;

      // Get the last child of the list
      const lastChild = nodeBefore.lastChild;
      if (!lastChild) return false;

      // Calculate positions
      const deleteFrom = $before.pos;
      const deleteTo = deleteFrom + $cursor.parent.nodeSize;

      // Get the content to join
      const contentToJoin = $cursor.parent.content;

      // Delete the current paragraph
      tr.delete(deleteFrom, deleteTo);

      // Calculate the position to insert at (end of last list item's content)
      const insertPos = $before.pos - 1;

      // Insert the content at the end of the last list item
      tr.insert(insertPos, contentToJoin);

      // Calculate the position of the last child
      const lastChildPos = $before.pos;

      // Set selection to the end of the last child
      const $lastChildPos = tr.doc.resolve(lastChildPos);
      tr.setSelection(TextSelection.near($lastChildPos, -1));

      dispatch(tr);
    }
    return true;
  }
  const { depth } = $cursor;
  if (depth < 2) return false;
  const listDepth = depth - 1;

  const listNode = $cursor.node(listDepth);
  if (!isListNode(listNode)) return false;

  const indexInList = $cursor.index(listDepth);

  if (indexInList === 0) {
    if (dispatch) {
      liftListContent(state, dispatch, $cursor);
    }
    return true;
  }

  if (indexInList === listNode.childCount - 1) {
    if (dispatch) {
      liftParent(state, dispatch, $cursor);
    }
    return true;
  }

  return false;
};

function liftListContent(state: EditorState, dispatch: (tr: Transaction) => void, $cursor: ResolvedPos) {
  const tr = state.tr;
  const listDepth = $cursor.depth - 1;
  const range = new NodeRange($cursor, tr.doc.resolve($cursor.end(listDepth)), listDepth);
  if (safeLift(tr, range)) {
    dispatch(tr);
  }
}

function liftParent(state: EditorState, dispatch: (tr: Transaction) => void, $cursor: ResolvedPos) {
  const tr = state.tr;
  const range = $cursor.blockRange();
  if (range && safeLift(tr, range)) {
    dispatch(tr);
  }
}
