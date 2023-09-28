import {
  useEditor as useEditorCore,
} from "@tiptap/react";
import { findTableAncestor } from "@/lib/utils";

export const useEditor = (props: any) => useEditorCore({
  editorProps: {
    attributes: {
      class: `prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none`,
    },
    handleDOMEvents: {
      keydown: (_view, event) => {
        // prevent default event listeners from firing when slash command is active
        if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          const slashCommand = document.querySelector("#slash-command");
          if (slashCommand) {
            return true;
          }
        }
      },
    },
    handlePaste: () => {
      if (typeof window !== "undefined") {
        const selection: any = window?.getSelection();
        if (selection.rangeCount !== 0) {
          const range = selection.getRangeAt(0);
          if (findTableAncestor(range.startContainer)) {
            return;
          }
        }
      }
    },
  },
  ...props,
});
