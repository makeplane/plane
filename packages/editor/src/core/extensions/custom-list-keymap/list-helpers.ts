import { Editor, getNodeType, getNodeAtPosition, isAtEndOfNode, isAtStartOfNode, isNodeActive } from "@tiptap/core";
import { Node, NodeType } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";

const findListItemPos = (typeOrName: string | NodeType, state: EditorState) => {
  const { $from } = state.selection;
  const nodeType = getNodeType(typeOrName, state.schema);

  let currentNode = null;
  let currentDepth = $from.depth;
  let currentPos = $from.pos;
  let targetDepth: number | null = null;

  while (currentDepth > 0 && targetDepth === null) {
    currentNode = $from.node(currentDepth);

    if (currentNode.type === nodeType) {
      targetDepth = currentDepth;
    } else {
      currentDepth -= 1;
      currentPos -= 1;
    }
  }

  if (targetDepth === null) {
    return null;
  }

  return { $pos: state.doc.resolve(currentPos), depth: targetDepth };
};

const nextListIsDeeper = (typeOrName: string, state: EditorState) => {
  const listDepth = getNextListDepth(typeOrName, state);
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos || !listDepth) {
    return false;
  }

  if (listDepth > listItemPos.depth) {
    return true;
  }

  return false;
};

const getNextListDepth = (typeOrName: string, state: EditorState) => {
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos) {
    return false;
  }

  const [, depth] = getNodeAtPosition(state, typeOrName, listItemPos.$pos.pos + 4);

  return depth;
};

const getPrevListDepth = (typeOrName: string, state: EditorState) => {
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos) {
    return false;
  }

  let depth = 0;
  const pos = listItemPos.$pos;

  // Adjust the position to ensure we're within the list item, especially for edge cases
  const resolvedPos = state.doc.resolve(Math.max(pos.pos - 1, 0));

  // Traverse up the document structure from the adjusted position
  for (let d = resolvedPos.depth; d > 0; d--) {
    const node = resolvedPos.node(d);
    if (node.type.name === "bulletList" || node.type.name === "orderedList" || node.type.name === "taskList") {
      // Increment depth for each list ancestor found
      depth++;
    }
  }

  // Subtract 1 from the calculated depth to get the parent list's depth
  // This adjustment is necessary because the depth calculation includes the current list
  // By subtracting 1, we aim to get the depth of the parent list, which helps in identifying if the current list is a sublist
  depth = depth > 0 ? depth - 1 : 0;

  // Double the depth value to get results as 2, 4, 6, 8, etc.
  depth = depth * 2;

  return depth;
};

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

  // is the paragraph node inside of the current list item (maybe with a hard break)
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

export const handleDelete = (editor: Editor, name: string) => {
  // if the cursor is not inside the current node type
  // do nothing and proceed
  if (!isNodeActive(editor.state, name)) {
    return false;
  }

  // if the cursor is not at the end of a node
  // do nothing and proceed
  if (!isAtEndOfNode(editor.state, name)) {
    return false;
  }

  // check if the next node is a list with a deeper depth
  if (nextListIsDeeper(name, editor.state)) {
    return editor
      .chain()
      .focus(editor.state.selection.from + 4)
      .lift(name)
      .joinBackward()
      .run();
  }

  if (nextListIsHigher(name, editor.state)) {
    return editor.chain().joinForward().joinBackward().run();
  }

  return editor.commands.joinItemForward();
};

const hasListBefore = (editorState: EditorState, name: string, parentListTypes: string[]) => {
  const { $anchor } = editorState.selection;

  const previousNodePos = Math.max(0, $anchor.pos - 2);

  const previousNode = editorState.doc.resolve(previousNodePos).node();

  if (!previousNode || !parentListTypes.includes(previousNode.type.name)) {
    return false;
  }

  return true;
};

const prevListIsHigher = (typeOrName: string, state: EditorState) => {
  const listDepth = getPrevListDepth(typeOrName, state);
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos || !listDepth) {
    return false;
  }

  if (listDepth < listItemPos.depth) {
    return true;
  }

  return false;
};

const nextListIsSibling = (typeOrName: string, state: EditorState) => {
  const listDepth = getNextListDepth(typeOrName, state);
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos || !listDepth) {
    return false;
  }

  if (listDepth === listItemPos.depth) {
    return true;
  }

  return false;
};

export const nextListIsHigher = (typeOrName: string, state: EditorState) => {
  const listDepth = getNextListDepth(typeOrName, state);
  const listItemPos = findListItemPos(typeOrName, state);

  if (!listItemPos || !listDepth) {
    return false;
  }

  if (listDepth < listItemPos.depth) {
    return true;
  }

  return false;
};

const listItemHasSubList = (typeOrName: string, state: EditorState, node?: Node) => {
  if (!node) {
    return false;
  }

  const nodeType = getNodeType(typeOrName, state.schema);

  let hasSubList = false;

  node.descendants((child) => {
    if (child.type === nodeType) {
      hasSubList = true;
    }
  });

  return hasSubList;
};

const isCurrentParagraphASibling = (state: EditorState): boolean => {
  const { $from } = state.selection;
  const listItemNode = $from.node(-1); // Get the parent node of the current selection, assuming it's a list item.
  const currentParagraphNode = $from.parent; // Get the current node where the selection is.

  // Ensure we're in a paragraph and the parent is a list item.
  if (
    currentParagraphNode.type.name === "paragraph" &&
    (listItemNode.type.name === "listItem" || listItemNode.type.name === "taskItem")
  ) {
    let paragraphNodesCount = 0;
    listItemNode.forEach((child) => {
      if (child.type.name === "paragraph") {
        paragraphNodesCount++;
      }
    });

    // If there are more than one paragraph nodes, the current paragraph is a sibling.
    return paragraphNodesCount > 1;
  }

  return false;
};

export function isCursorInSubList(editor: Editor) {
  const { selection } = editor.state;
  const { $from } = selection;

  // Check if the current node is a list item
  const listItem = editor.schema.nodes.listItem;
  const taskItem = editor.schema.nodes.taskItem;

  // Traverse up the document tree from the current position
  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type === listItem || node.type === taskItem) {
      // If the parent of the list item is also a list, it's a sub-list
      const parent = $from.node(depth - 1);
      if (
        parent &&
        (parent.type === editor.schema.nodes.bulletList ||
          parent.type === editor.schema.nodes.orderedList ||
          parent.type === editor.schema.nodes.taskList)
      ) {
        return true;
      }
    }
  }

  return false;
}

const hasListItemBefore = (typeOrName: string, state: EditorState): boolean => {
  const { $anchor } = state.selection;

  const $targetPos = state.doc.resolve($anchor.pos - 2);

  if ($targetPos.index() === 0) {
    return false;
  }

  if ($targetPos.nodeBefore?.type.name !== typeOrName) {
    return false;
  }

  return true;
};
