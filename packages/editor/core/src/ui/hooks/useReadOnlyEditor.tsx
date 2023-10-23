import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import { useImperativeHandle, useRef, MutableRefObject } from "react";
import { CoreReadOnlyEditorExtensions } from "../../ui/read-only/extensions";
import { CoreReadOnlyEditorProps } from "../../ui/read-only/props";
import { EditorProps } from '@tiptap/pm/view';

interface CustomReadOnlyEditorProps {
  value: string;
  forwardedRef?: any;
  extensions?: any;
  editorProps?: EditorProps;
}

export const useReadOnlyEditor = ({ value, forwardedRef, extensions = [], editorProps = {} }: CustomReadOnlyEditorProps) => {
  const editor = useCustomEditor({
    editable: false,
    content: (typeof value === "string" && value.trim() !== "") ? value : "<p></p>",
    editorProps: {
      ...CoreReadOnlyEditorProps,
      ...editorProps,
    },
    extensions: [...CoreReadOnlyEditorExtensions, ...extensions],
  });

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
