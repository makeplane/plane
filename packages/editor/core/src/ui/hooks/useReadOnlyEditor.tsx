import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import {
  useImperativeHandle,
  useRef,
  MutableRefObject,
  useEffect,
} from "react";
import { CoreReadOnlyEditorExtensions } from "../../ui/read-only/extensions";
import { CoreReadOnlyEditorProps } from "../../ui/read-only/props";
import { EditorProps } from '@tiptap/pm/view';
import { IMentionSuggestion } from "../../types/mention-suggestion";

interface CustomReadOnlyEditorProps {
  value: string;
  forwardedRef?: any;
  extensions?: any;
  editorProps?: EditorProps;
  mentionHighlights?: string[];
  mentionSuggestions?: IMentionSuggestion[];
}

export const useReadOnlyEditor = ({ value, forwardedRef, extensions = [], editorProps = {}, mentionHighlights, mentionSuggestions}: CustomReadOnlyEditorProps) => {
  const editor = useCustomEditor({
    editable: false,
    content:
      typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
    editorProps: {
      ...CoreReadOnlyEditorProps,
      ...editorProps,
    },
    extensions: [...CoreReadOnlyEditorExtensions({ mentionSuggestions: mentionSuggestions ?? [], mentionHighlights: mentionHighlights ?? []}), ...extensions],
  });

  const hasIntiliazedContent = useRef(false);
  useEffect(() => {
    if (editor && !value && !hasIntiliazedContent.current) {
      editor.commands.setContent(value);
      hasIntiliazedContent.current = true;
    }
  }, [value]);

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
