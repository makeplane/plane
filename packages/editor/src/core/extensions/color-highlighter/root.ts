import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
// helpers
import { findAllColors } from "./helpers";

export const ColorHighlighter = Extension.create({
  name: "colorHighlighter",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        state: {
          init(_, { doc }) {
            return findAllColors(doc);
          },
          apply(transaction, oldState) {
            return transaction.docChanged ? findAllColors(transaction.doc) : oldState;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
