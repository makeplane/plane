import { chainCommands } from "@tiptap/pm/commands";
import { isTextSelection } from "@tiptap/core";
import { canSplit } from "@tiptap/pm/transform";
import {
  type NodeSelection,
  type Command,
  type EditorState,
  Selection,
  TextSelection,
  type Transaction,
} from "@tiptap/pm/state";

import { enterWithoutLift } from "./enter-without-lift";
import { NodeType, Attrs, Mark, Fragment, NodeRange, type Node as ProsemirrorNode, Slice } from "@tiptap/pm/model";

import { ListAttributes, isListNode } from "prosemirror-flat-list";
import { dedentNodeRange } from "./dedent-list";

/**
 * Returns a command that split the current list node.
 *
 * @public @group Commands
 *
 */
export function createSplitListCommand(): Command {
  return chainCommands(splitBlockNodeSelectionInListCommand, splitListCommand);
}

function deriveListAttributes(listNode: ProsemirrorNode): ListAttributes {
  // For the new list node, we don't want to inherit any list attribute (For example: `checked`) other than `kind`
  return { kind: (listNode.attrs as ListAttributes).kind };
}

const splitBlockNodeSelectionInListCommand: Command = (state, dispatch) => {
  if (!isBlockNodeSelection(state.selection)) {
    return false;
  }
  console.log("aaya 1");

  const selection = state.selection;
  const { $to, node } = selection;
  const parent = $to.parent;

  // We only cover the case that
  // 1. the list node only contains one child node
  // 2. this child node is not a list node
  if (isListNode(node) || !isListNode(parent) || parent.childCount !== 1 || parent.firstChild !== node) {
    return false;
  }

  const listType = parent.type;
  const nextList = listType.createAndFill(deriveListAttributes(parent));
  if (!nextList) {
    return false;
  }

  if (dispatch) {
    const tr = state.tr;
    const cutPoint = $to.pos;
    tr.replace(cutPoint, cutPoint, new Slice(Fragment.fromArray([listType.create(), nextList]), 1, 1));
    const newSelection = TextSelection.near(tr.doc.resolve(cutPoint));
    if (isTextSelection(newSelection)) {
      tr.setSelection(newSelection);
      dispatch(tr);
    }
  }

  return true;
};

const splitListCommand: Command = (state, dispatch): boolean => {
  if (isBlockNodeSelection(state.selection)) {
    return false;
  }

  console.log("sadf");
  const { $from, $to } = state.selection;

  if (!$from.sameParent($to)) {
    return false;
  }

  if ($from.depth < 2) {
    return false;
  }

  const listDepth = $from.depth - 1;
  const listNode = $from.node(listDepth);

  if (!isListNode(listNode)) {
    return false;
  }

  const parent = $from.parent;

  const indexInList = $from.index(listDepth);
  const parentEmpty = parent.content.size === 0;

  // When the cursor is inside the first child of the list:
  //    If the parent block is empty, dedent the list;
  //    otherwise split and create a new list node.
  // When the cursor is inside the second or further children of the list:
  //    Create a new paragraph.

  if (indexInList === 0) {
    console.log("running 2");
    return doSplitList(state, listNode, dispatch);
  } else {
    return doSplitList(state, listNode, dispatch);
  }
};

/**
 * @internal
 */
export function doSplitList(
  state: EditorState,
  listNode: ProsemirrorNode,
  dispatch?: (tr: Transaction) => void
): boolean {
  const tr = state.tr;
  const listType = listNode.type;
  const attrs: ListAttributes = listNode.attrs;
  const newAttrs: ListAttributes = deriveListAttributes(listNode);

  tr.delete(tr.selection.from, tr.selection.to);

  const { $from, $to } = tr.selection;

  const { parentOffset } = $to;

  const atStart = parentOffset == 0;
  const atEnd = parentOffset == $to.parent.content.size;

  if (atStart) {
    if (dispatch) {
      const pos = $from.before(-1);
      tr.insert(pos, createAndFill(listType, newAttrs));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }

  if (atEnd && attrs.collapsed) {
    if (dispatch) {
      const pos = $from.after(-1);
      tr.insert(pos, createAndFill(listType, newAttrs));
      tr.setSelection(Selection.near(tr.doc.resolve(pos)));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }

  // If split the list at the start or at the middle, we want to inherit the
  // current parent type (e.g. heading); otherwise, we want to create a new
  // default block type (typically paragraph)
  const nextType = atEnd ? listNode.contentMatchAt(0).defaultType : undefined;
  const typesAfter = [{ type: listType, attrs: newAttrs }, nextType ? { type: nextType } : null];

  if (!canSplit(tr.doc, $from.pos, 2, typesAfter)) {
    return false;
  }

  dispatch?.(tr.split($from.pos, 2, typesAfter).scrollIntoView());
  return true;
}

export function createAndFill(
  type: NodeType,
  attrs?: Attrs | null,
  content?: Fragment | ProsemirrorNode | readonly ProsemirrorNode[] | null,
  marks?: readonly Mark[]
) {
  const node = type.createAndFill(attrs, content, marks);
  if (!node) {
    throw new RangeError(`Failed to create '${type.name}' node`);
  }
  node.check();
  return node;
}

export function isBlockNodeSelection(selection: Selection): selection is NodeSelection {
  const isNodeSelectionBool = isNodeSelection(selection) && selection.node.type.isBlock;
  return isNodeSelectionBool;
}

export function isNodeSelection(selection: Selection): selection is NodeSelection {
  return Boolean((selection as NodeSelection).node);
}

// const splitListCommand: Command = (state, dispatch): boolean => {
//   if (isBlockNodeSelection(state.selection)) {
//     return false;
//   }
//   console.log("aaya 2");
//
//   const { $from, $to } = state.selection;
//
//   if (!$from.sameParent($to)) {
//     console.log("not same parent");
//     return false;
//   }
//
//   if ($from.depth < 2) {
//     console.log("depth is less than 2");
//     return false;
//   }
//
//   const listDepth = $from.depth - 1;
//   const listNode = $from.node(listDepth);
//
//   if (!isListNode(listNode)) {
//     console.log("not a list node");
//     // return enterWithoutLift(state, dispatch);
//     return false;
//   }
//
//   const parent = $from.parent;
//
//   const indexInList = $from.index(listDepth);
//
//   // When the cursor is inside the first child of the list:
//   //    If the parent block is empty, dedent the list;
//   //    otherwise split and create a new list node.
//   // When the cursor is inside the second or further children of the list:
//   //    Create a new paragraph.
//
//   if (indexInList === 0) {
//     console.log("running 2");
//     return doSplitList(state, listNode, dispatch);
//   } else {
//     return doSplitList(state, listNode, dispatch);
//   }
// };
