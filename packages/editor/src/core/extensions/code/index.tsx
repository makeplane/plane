import { Selection, TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ts from "highlight.js/lib/languages/typescript";
import { common, createLowlight } from "lowlight";
// components
import { CodeBlockLowlight } from "./code-block-lowlight";
import { CodeBlockComponent } from "./code-block-node-view";

const lowlight = createLowlight(common);
lowlight.register("ts", ts);

export const CustomCodeBlockExtension = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },
  // @ts-expect-error keyboard shortcuts are not typed
  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        if (editor.isActive("codeBlock")) {
          return editor.commands.newlineInCode();
        }
      },
      Tab: ({ editor }) => {
        try {
          const { state } = editor;
          const { selection } = state;
          const { $from, $to, empty } = selection;

          if ($from.parent.type !== this.type) {
            return false;
          }

          let tr = state.tr;

          // Store initial selection positions
          const initialFrom = selection.from;
          const initialTo = selection.to;
          let offset = 0;

          // Handle selection case
          if (!empty) {
            // Find the start of the first line in selection
            let startPos = $from.pos;
            while (startPos > $from.start() && !/[\n\r]/.test(state.doc.textBetween(startPos - 1, startPos))) {
              startPos--;
            }

            // Find the end of the last line in selection
            let endPos = $to.pos;
            while (endPos < $to.end() && !/[\n\r]/.test(state.doc.textBetween(endPos, endPos + 1))) {
              endPos++;
            }

            // Get the text content between start and end
            const selectedText = state.doc.textBetween(startPos, endPos);
            const lines = selectedText.split("\n");

            // Add tabs to each line
            let currentOffset = 0;
            lines.forEach((line, index) => {
              const pos = startPos + currentOffset;
              tr = tr.insertText("\t", pos, pos);
              currentOffset += line.length + 1 + 1; // +1 for newline, +1 for the inserted tab

              // Update the total offset for selection adjustment
              if (pos < initialFrom) offset++;
            });

            // Restore selection with adjusted positions
            const newSelection = TextSelection.create(tr.doc, initialFrom + offset, initialTo + offset);
            tr = tr.setSelection(newSelection);
          } else {
            // Single line case
            let lineStart = $from.pos;
            while (lineStart > $from.start() && !/[\n\r]/.test(state.doc.textBetween(lineStart - 1, lineStart))) {
              lineStart--;
            }

            tr = tr.insertText("\t", lineStart, lineStart);

            // Adjust cursor position
            const newSelection = TextSelection.create(tr.doc, initialFrom + 1, initialTo + 1);
            tr = tr.setSelection(newSelection);
          }

          editor.view.dispatch(tr);
          return true;
        } catch (error) {
          console.error("Error handling Tab in CustomCodeBlockExtension:", error);
          return false;
        }
      },
      "Shift-Tab": ({ editor }) => {
        try {
          const { state } = editor;
          const { selection } = state;
          const { $from, $to, empty } = selection;

          if ($from.parent.type !== this.type) {
            return false;
          }

          let tr = state.tr;

          // Store initial selection positions
          const initialFrom = selection.from;
          const initialTo = selection.to;
          let offset = 0;

          // Handle selection case
          if (!empty) {
            // Find the start of the first line in selection
            let startPos = $from.pos;
            while (startPos > $from.start() && !/[\n\r]/.test(state.doc.textBetween(startPos - 1, startPos))) {
              startPos--;
            }

            // Find the end of the last line in selection
            let endPos = $to.pos;
            while (endPos < $to.end() && !/[\n\r]/.test(state.doc.textBetween(endPos, endPos + 1))) {
              endPos++;
            }

            // Get the text content between start and end
            const selectedText = state.doc.textBetween(startPos, endPos);
            const lines = selectedText.split("\n");

            // Remove tabs from each line
            let currentOffset = 0;
            for (let i = 0; i < lines.length; i++) {
              const pos = startPos + currentOffset;
              const firstChar = state.doc.textBetween(pos, pos + 1);

              if (firstChar === "\t") {
                tr = tr.delete(pos, pos + 1);
                if (pos < initialFrom) offset--;
                currentOffset += lines[i].length; // Don't add 1 for the deleted tab
              } else {
                currentOffset += lines[i].length + 1; // +1 for newline
              }
            }

            // Restore selection with adjusted positions
            const newSelection = TextSelection.create(
              tr.doc,
              Math.max(initialFrom + offset, 0),
              Math.max(initialTo + offset, 0)
            );
            tr = tr.setSelection(newSelection);
          } else {
            // Single line case
            let lineStart = $from.pos;
            while (lineStart > $from.start() && !/[\n\r]/.test(state.doc.textBetween(lineStart - 1, lineStart))) {
              lineStart--;
            }

            const firstChar = state.doc.textBetween(lineStart, lineStart + 1);
            if (firstChar === "\t") {
              tr = tr.delete(lineStart, lineStart + 1);

              // Adjust cursor position
              const newSelection = TextSelection.create(
                tr.doc,
                Math.max(initialFrom - 1, lineStart),
                Math.max(initialTo - 1, lineStart)
              );
              tr = tr.setSelection(newSelection);
            }
          }

          editor.view.dispatch(tr);
          return true;
        } catch (error) {
          console.error("Error handling Shift-Tab in CustomCodeBlockExtension:", error);
          return false;
        }
      },
      ArrowUp: ({ editor }) => {
        try {
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
        } catch (error) {
          console.error("Error handling ArrowUp in CustomCodeBlockExtension:", error);
          return false;
        }
      },
      ArrowDown: ({ editor }) => {
        try {
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
        } catch (error) {
          console.error("Error handling ArrowDown in CustomCodeBlockExtension:", error);
          return false;
        }
      },
    };
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
  exitOnTripleEnter: false,
  HTMLAttributes: {
    class: "",
  },
});
