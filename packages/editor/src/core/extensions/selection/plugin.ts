import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { MultiRangeSelection } from "./MultiRangeSelection";

export const multiSelectionDecorationPluginKey = new PluginKey("multiSelectionDecorationPlugin");

export function createMultiSelectionDecorationPlugin() {
  return new Plugin({
    key: multiSelectionDecorationPluginKey,
    props: {
      decorations(state) {
        const { doc, selection } = state;

        // Only create decorations if we have a MultiRangeSelection
        if (!(selection instanceof MultiRangeSelection)) {
          return null;
        }

        const decorations: Decoration[] = [];

        // (1) Decorate all nodes so that their ::selection is transparent,
        // because we only want to highlight the actual selection range
        doc.nodesBetween(0, doc.nodeSize - 2, (node, pos) => {
          decorations.push(
            Decoration.inline(pos, pos + node.nodeSize, {
              class: "multiple-selection",
            })
          );
        });

        // (2) Decorate the actual selection ranges in a visible style
        selection.ranges.forEach((range) => {
          decorations.push(
            Decoration.inline(range.$from.pos, range.$to.pos, {
              class: "selected-text",
            })
          );
        });

        return DecorationSet.create(doc, decorations);
      },
    },
  });
}
