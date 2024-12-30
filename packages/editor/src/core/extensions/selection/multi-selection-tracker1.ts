import { Extension } from "@tiptap/core";
import { SelectionRange } from "@tiptap/pm/state";
import { MultiRangeSelection } from "./MultiRangeSelection";
import { createMultiSelectionDecorationPlugin } from "./plugin";

export const multipleSelectionExtension = Extension.create({
  name: "multiSelectionExtension",

  addStorage() {
    return {
      selectedRanges: [] as SelectionRange[],
    };
  },

  addProseMirrorPlugins() {
    return [createMultiSelectionDecorationPlugin()];
  },

  onCreate() {
    const editorView = this.editor.view;
    const storage = this.storage;

    // Listen for mousedown: If not holding ctrl, reset selection ranges
    editorView.dom.addEventListener("mousedown", (event) => {
      console.log("event.ctrlKey", event.metaKey);
      if (!event.metaKey) {
        storage.selectedRanges = [];
      }
    });

    // Listen for mouseup: If holding ctrl, add to ranges, else reset
    editorView.dom.addEventListener("mouseup", (event) => {
      const { state, dispatch } = editorView;
      const { selection } = state;

      // Only proceed if it’s a normal TextSelection and user is holding ctrl
      if (event.metaKey) {
        const newRange = selection.ranges[0];

        // Accumulate ranges
        storage.selectedRanges.push(newRange);

        // Sort them by start position
        storage.selectedRanges.sort((r1, r2) => r1.$from.pos - r2.$from.pos);

        // Construct a new multi-range selection
        const tr = state.tr;
        const multiSelection = MultiRangeSelection.create(storage.selectedRanges);
        tr.setSelection(multiSelection);
        dispatch(tr);
      } else {
        // Single selection: just store that range
        storage.selectedRanges = [selection.ranges[0]];
      }
    });
  },
});
