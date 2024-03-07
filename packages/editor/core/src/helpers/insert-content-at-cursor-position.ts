import { Selection } from "@tiptap/pm/state";
import { Editor } from "@tiptap/react";
import { MutableRefObject } from "react";

export const insertContentAtSavedSelection = (
  editorRef: MutableRefObject<Editor | null>,
  content: string,
  savedSelection: Selection
) => {
  if (editorRef.current && savedSelection) {
    editorRef.current
      .chain()
      .focus()
      .insertContentAt(savedSelection?.anchor, content)
      .run();
  }
};
