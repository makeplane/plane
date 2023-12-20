import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import { useImperativeHandle, useRef, MutableRefObject } from "react";
import { CoreReadOnlyEditorExtensions } from "src/ui/read-only/extensions";
import { CoreReadOnlyEditorProps } from "src/ui/read-only/props";
import { EditorProps } from "@tiptap/pm/view";
import { IMentionSuggestion } from "src/types/mention-suggestion";

interface CustomReadOnlyEditorProps {
  value: string;
  forwardedRef?: any;
  extensions?: any;
  editorProps?: EditorProps;
  rerenderOnPropsChange?: {
    id: string;
    description_html: string;
  };
  mentionHighlights?: string[];
  mentionSuggestions?: IMentionSuggestion[];
}

export const useReadOnlyEditor = ({
  value,
  forwardedRef,
  extensions = [],
  editorProps = {},
  rerenderOnPropsChange,
  mentionHighlights,
  mentionSuggestions,
}: CustomReadOnlyEditorProps) => {
  const editor = useCustomEditor(
    {
      editable: false,
      content: typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
      editorProps: {
        ...CoreReadOnlyEditorProps,
        ...editorProps,
      },
      extensions: [
        ...CoreReadOnlyEditorExtensions({
          mentionSuggestions: mentionSuggestions ?? [],
          mentionHighlights: mentionHighlights ?? [],
        }),
        ...extensions,
      ],
    },
    [rerenderOnPropsChange]
  );

  const editorRef: MutableRefObject<Editor | null> = useRef(null);
  editorRef.current = editor;

  useImperativeHandle(forwardedRef, () => ({
    clearEditor: () => {
      editorRef.current?.commands.clearContent();
    },
    setEditorValue: (content: string) => {
      editorRef.current?.commands.setContent(content);
    },
  }));

  if (!editor) {
    return null;
  }

  return editor;
};
