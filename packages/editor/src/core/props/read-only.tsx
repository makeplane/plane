import { EditorProps } from "@tiptap/pm/view";
// helpers
import { cn } from "@/helpers/common";
// props
import { TCoreEditorProps } from "@/props";

export const CoreReadOnlyEditorProps = (props: TCoreEditorProps): EditorProps => {
  const { editorClassName } = props;

  return {
    attributes: {
      class: cn(
        "prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none",
        editorClassName
      ),
    },
  };
};
