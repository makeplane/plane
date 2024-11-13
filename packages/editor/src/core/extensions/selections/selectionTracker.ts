import "../ui/skiff-selection.css";

import { Node as ProsemirrorNode } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, TextSelection, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

// import { isInCodeblock } from "../codeblock/utils";
// import {
//   LIST_ITEM,
//   LIST_TASK_ITEM,
//   TABLE_CELL,
//   TEXT,
//   TOGGLE_ITEM_CONTENT,
//   TOGGLE_ITEM_TITLE,
//   TOGGLE_LIST_ITEM,
// } from "../NodeNames";
import { CellSelection } from "@tiptap/pm/tables";

const DOUBLE_CLICK_THRESH = 50;
const TRIPLE_CLICK_THRESH = 500;

enum CrossNodeSelectionState {
  /** The current selection is cross-node. */
  Yes,
  /**
   * Since the previous cross-node selection, we haven't returned to a "normal"
   * text selection, instead the whole node is selected.
   */
  Transitioning,
  /** The current selection is not cross-node and not transitioning. */
  No,
}

interface SelectionTrackerState {
  start: number;
  end: number;
  decorations: DecorationSet;
  /**
   * keeps track of the anchor when text selection starts,
   * used to restore the anchor when moving from cross node selection back to single node selection
   */
  originAnchor: number;
  /**
   * keeps track of the last time there was a double click,
   * to prevent double click from selecting only part of text
   */
  lastDoubleClick: Date;
  /**
   * keeps track of the last time there was a triple click,
   * to prevent triple click from selecting only part of text
   */
  lastTripleClick: Date;
  /**
   * keeps track of whether the selection is a cross node selection,
   * to let us know when we change from cross node to normal selection
   * (hence should restore originAnchor)
   */
  crossNodeSelectionState: CrossNodeSelectionState;
}

const selectionTrackerKey = new PluginKey("selectionTrackerPlugin");

const SKIPPED_NODES_FOR_DECORATIONS = [
  TOGGLE_LIST_ITEM,
  LIST_ITEM,
  LIST_TASK_ITEM,
  TOGGLE_ITEM_TITLE,
  TOGGLE_ITEM_CONTENT,
  TEXT,
];

const validateNodeForSelectionDecoration = (node: ProsemirrorNode, parent: ProsemirrorNode) => {
  if (SKIPPED_NODES_FOR_DECORATIONS.includes(node.type.name)) return false;

  if (parent.type.name === TABLE_CELL && parent.childCount === 1) return false;

  return true;
};

const SelectionTracker = () =>
  new Plugin({
    key: selectionTrackerKey,
    state: {
      init() {
        return {
          start: null,
          end: null,
          decorations: DecorationSet.empty,
          originAnchor: null,
          lastDoubleClick: new Date(),
          lastTripleClick: new Date(),
          crossNodeSelectionState: CrossNodeSelectionState.No,
        };
      },
      apply(
        tr: Transaction,
        {
          start,
          end,
          decorations,
          originAnchor,
          lastDoubleClick,
          lastTripleClick,
          crossNodeSelectionState,
        }: SelectionTrackerState,
        _oldState: EditorState,
        newState: EditorState
      ) {
        const { selection: sel } = newState;

        const { anchor, head } = sel;

        // Update lastDoubleClick and lastTripleCLick by meta or prev state
        const meta = tr.getMeta(selectionTrackerKey);
        if (meta) {
          if (meta.lastDoubleClick) {
            lastDoubleClick = meta.lastDoubleClick;
          }
          if (meta.lastTripleClick) {
            lastTripleClick = meta.lastTripleClick;
          }
        }

        if (sel.from === sel.to || sel instanceof CellSelection)
          return {
            start: null,
            end: null,
            decorations: DecorationSet.empty,
            originAnchor: anchor,
            lastDoubleClick,
            lastTripleClick,
            crossNodeSelectionState: CrossNodeSelectionState.No,
          };

        // if its the sames selection, return the old value
        if (end === head && start === anchor)
          return {
            start,
            head,
            decorations,
            originAnchor,
            lastDoubleClick,
            lastTripleClick,
            crossNodeSelectionState,
          };

        const newDecorations: Decoration[] = [];

        newState.doc.nodesBetween(sel.from, sel.to, (node, pos, parent) => {
          const backwardsSelection = sel.anchor > sel.head;
          const nodeInsideSelection =
            pos >= sel.from - 1 && pos + node.nodeSize <= sel.to + (backwardsSelection ? 1 : 0);

          if (nodeInsideSelection && validateNodeForSelectionDecoration(node, parent)) {
            newDecorations.push(
              Decoration.node(pos, pos + node.nodeSize, {
                class: "selectionAroundNode",
              })
            );
            return false;
          }
          return true;
        });

        const newSet = DecorationSet.create(newState.doc, newDecorations);

        // Update crossNodeSelectionState:
        // - If the current selection has multiple children, it's cross-node (Yes)
        // - If we were previously in a cross-node selection and are still selecting
        // an entire node, it's Transitioning. This happens when you drag from a cross-node
        // selection back to a normal one: there is an in-between state where you are just
        // selecting one node, but as an entire block.
        // - Otherwise it's a normal, sub-node selection (No).
        let newCrossNodeSelectionState = CrossNodeSelectionState.No;
        if (sel.content().content.childCount > 1) {
          newCrossNodeSelectionState = CrossNodeSelectionState.Yes;
        } else if (
          (crossNodeSelectionState === CrossNodeSelectionState.Yes ||
            crossNodeSelectionState === CrossNodeSelectionState.Transitioning) &&
          sel.$from.parentOffset === 0 &&
          sel.$to.parentOffset === sel.$to.parent.content.size
        ) {
          newCrossNodeSelectionState = CrossNodeSelectionState.Transitioning;
        }

        return {
          start: sel.anchor,
          end: sel.head,
          decorations: newSet,
          originAnchor,
          lastDoubleClick,
          lastTripleClick,
          crossNodeSelectionState: newCrossNodeSelectionState,
        };
      },
    },
    appendTransaction(transactions: Transaction[], _oldState: EditorState, newState: EditorState) {
      const { selection: sel } = newState;
      const {
        originAnchor,
        lastDoubleClick,
        lastTripleClick,
        crossNodeSelectionState: oldCrossNodeSelectionState,
      } = selectionTrackerKey.getState(newState) as SelectionTrackerState;

      if (!(sel instanceof TextSelection)) return null;

      const isCrossNodesSelection = sel.content().content.childCount > 1;
      const selectionChanged = transactions.reduce((changed, tr) => changed || tr.selectionSet, false);
      const currentTime = new Date().getTime();
      const wasJustDoubleClicked = currentTime - lastDoubleClick.getTime() < DOUBLE_CLICK_THRESH;
      const wasJustTripleClicked = currentTime - lastTripleClick.getTime() < TRIPLE_CLICK_THRESH;
      const isInCodeBlock = isInCodeblock(newState, newState.selection.from);
      if (isCrossNodesSelection && selectionChanged) {
        return null;
      }

      // to avoid breaking double click to select entire word
      // we check if we just double clicked or triple clicked and then dont change selection
      if (wasJustDoubleClicked || wasJustTripleClicked) {
        return null;
      }

      // handle changing from cross node selection back to single node selection,
      // create a selection from the origin anchor to the current head
      // this is ignored on codeblock to prevent bug where selection with prosemirror is not synced with codemirror
      if (
        selectionChanged &&
        !isCrossNodesSelection &&
        (oldCrossNodeSelectionState === CrossNodeSelectionState.Yes ||
          oldCrossNodeSelectionState === CrossNodeSelectionState.Transitioning) &&
        sel.anchor !== originAnchor &&
        sel.anchor !== sel.head &&
        !isInCodeBlock
      ) {
        const { tr } = newState;
        tr.setSelection(TextSelection.create(tr.doc, originAnchor, Math.min(sel.head, tr.doc.nodeSize - 2)));
        return tr;
      }

      return null;
    },
    props: {
      decorations(state) {
        const deco = this.spec.key?.getState(state);
        return deco.decorations;
      },
      handleDoubleClick(view) {
        view.dispatch(view.state.tr.setMeta(selectionTrackerKey, { lastDoubleClick: new Date() }));
        return false;
      },
      handleTripleClick(view) {
        view.dispatch(view.state.tr.setMeta(selectionTrackerKey, { lastTripleClick: new Date() }));
        return false;
      },
    },
  });

export default SelectionTracker;
