import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import { common, createLowlight } from "lowlight";
import ts from "highlight.js/lib/languages/typescript";

const lowlight = createLowlight(common);
lowlight.register("ts", ts);

export const CustomCodeBlock = CodeBlockLowlight.extend({
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        return editor.commands.insertContent("    ");
      },
    };
  },
}).configure({
  lowlight,
  defaultLanguage: "plaintext",
  exitOnTripleEnter: false,
});
