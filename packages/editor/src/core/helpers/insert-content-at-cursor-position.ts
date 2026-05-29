import type { Editor } from "@tiptap/react";

export const insertContentAtSavedSelection = (editor: Editor, content: string) => {
  if (!editor || editor.isDestroyed) {
    console.error("Editor reference is not available or has been destroyed.");
    return;
  }

  if (!editor.state.selection) {
    console.error("Saved selection is invalid.");
    return;
  }

  const docSize = editor.state.doc.content.size;
  const safePosition = Math.max(0, Math.min(editor.state.selection.anchor, docSize));

  try {
    editor.chain().focus().insertContentAt(safePosition, content).run();
  } catch (error) {
    console.error("An error occurred while inserting content at saved selection:", error);
  }
};
