import { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";

export const useInitializedContent = (editor: Editor | null, value: string) => {
  const hasInitializedContent = useRef(false);

  useEffect(() => {
    if (editor) {
      const cleanedValue =
        typeof value === "string" && value.trim() !== "" ? value : "<p></p>";
      if (cleanedValue !== "<p></p>" && !hasInitializedContent.current) {
        editor.commands.setContent(cleanedValue);
        hasInitializedContent.current = true;
      } else if (cleanedValue === "<p></p>" && hasInitializedContent.current) {
        hasInitializedContent.current = false;
      }
    }
  }, [value, editor]);
};
