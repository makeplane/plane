import { EditorProps } from "@tiptap/pm/view";
// plane utils
import { cn } from "@plane/utils";
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
