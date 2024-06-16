import { useEffect } from "react";
import { EditorRefApi } from "@plane/document-editor";

const useFocusOnSlash = (editorRef: React.RefObject<EditorRefApi>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editorRef.current?.isEditorFocused()) {
        if (e.key === "/") {
          e.preventDefault();
          editorRef.current?.setFocusAtSavedSelection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editorRef]);
};

export default useFocusOnSlash;
