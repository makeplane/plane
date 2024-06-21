import { EditorProps } from "@tiptap/pm/view";
// helpers
import { cn } from "@/helpers/common";

export const CoreReadOnlyEditorProps = (editorClassName: string): EditorProps => ({
  attributes: {
    class: cn(
      "prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none",
      editorClassName
    ),
  },
});
