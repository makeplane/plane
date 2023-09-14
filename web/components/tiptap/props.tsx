import { EditorProps } from "@tiptap/pm/view";
import { startImageUpload } from "./plugins/upload-image";
import { findTableAncestor } from "./table-menu";

export function TiptapEditorProps(
  workspaceSlug: string,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
): EditorProps {
  return {
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
    handlePaste: (view, event) => {
      if (typeof window !== "undefined") {
        const selection: any = window?.getSelection();
        if (selection.rangeCount !== 0) {
          const range = selection.getRangeAt(0);
          if (findTableAncestor(range.startContainer)) {
            return;
          }
        }
      }
      if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
        event.preventDefault();
        const file = event.clipboardData.files[0];
        const pos = view.state.selection.from;
        startImageUpload(file, view, pos, workspaceSlug, setIsSubmitting);
        return true;
      }
      return false;
    },
    handleDrop: (view, event, _slice, moved) => {
      if (typeof window !== "undefined") {
        const selection: any = window?.getSelection();
        if (selection.rangeCount !== 0) {
          const range = selection.getRangeAt(0);
          if (findTableAncestor(range.startContainer)) {
            return;
          }
        }
      }
      if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        // here we deduct 1 from the pos or else the image will create an extra node
        if (coordinates) {
          startImageUpload(file, view, coordinates.pos - 1, workspaceSlug, setIsSubmitting);
        }
        return true;
      }
      return false;
    },
  };
}
