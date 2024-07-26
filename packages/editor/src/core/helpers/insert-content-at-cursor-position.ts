import { MutableRefObject } from "react";
import { Selection } from "@tiptap/pm/state";
import { Editor } from "@tiptap/react";

export const insertContentAtSavedSelection = (
  editorRef: MutableRefObject<Editor | null>,
  content: string,
  savedSelection: Selection
) => {
  if (!editorRef.current || editorRef.current.isDestroyed) {
    console.error("Editor reference is not available or has been destroyed.");
    return;
  }

  if (!savedSelection) {
    console.error("Saved selection is invalid.");
    return;
  }

  const docSize = editorRef.current.state.doc.content.size;
  const safePosition = Math.max(0, Math.min(savedSelection.anchor, docSize));

  try {
    editorRef.current.chain().focus().insertContentAt(safePosition, content).run();
  } catch (error) {
    console.error("An error occurred while inserting content at saved selection:", error);
  }
};
