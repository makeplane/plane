import { EditorProps } from "@tiptap/pm/view";
import { cn } from "src/lib/utils";

export const CoreReadOnlyEditorProps = (editorClassName: string): EditorProps => ({
  attributes: {
    class: cn(
      "prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none",
      editorClassName
    ),
  },
});
