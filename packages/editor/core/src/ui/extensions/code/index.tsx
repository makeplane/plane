import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import { common, createLowlight } from "lowlight";
import ts from "highlight.js/lib/languages/typescript";

const lowlight = createLowlight(common);
lowlight.register("ts", ts);

import { Selection } from "@tiptap/pm/state";

export const CustomCodeBlockExtension = CodeBlockLowlight.extend({
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        // Use ProseMirror's insertText transaction to insert the tab character
        const tr = state.tr.insertText("\t", $from.pos, $from.pos);
        editor.view.dispatch(tr);

        return true;
      },
      ArrowUp: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtStart = $from.parentOffset === 0;

        if (!isAtStart) {
          return false;
        }

        // Check if codeBlock is the first node
        const isFirstNode = $from.depth === 1 && $from.index($from.depth - 1) === 0;

        if (isFirstNode) {
          // Insert a new paragraph at the start of the document and move the cursor to it
          return editor.commands.command(({ tr }) => {
            const node = editor.schema.nodes.paragraph.create();
            tr.insert(0, node);
            tr.setSelection(Selection.near(tr.doc.resolve(1)));
            return true;
          });
        }

        return false;
      },
      ArrowDown: ({ editor }) => {
        if (!this.options.exitOnArrowDown) {
          return false;
        }

        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

        if (!isAtEnd) {
          return false;
        }

        const after = $from.after();

        if (after === undefined) {
          return false;
        }

        const nodeAfter = doc.nodeAt(after);

        if (nodeAfter) {
          return editor.commands.command(({ tr }) => {
            tr.setSelection(Selection.near(doc.resolve(after)));
            return true;
          });
        }

        return editor.commands.exitCode();
      },
    };
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
  exitOnTripleEnter: false,
});
