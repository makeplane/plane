import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import { useImperativeHandle, useRef, MutableRefObject } from "react";
import { CoreReadOnlyEditorExtensions } from "src/ui/read-only/extensions";
import { CoreReadOnlyEditorProps } from "src/ui/read-only/props";
import { EditorProps } from "@tiptap/pm/view";
import { IMentionSuggestion } from "src/types/mention-suggestion";
import { EditorReadOnlyRefApi } from "src/types/editor-ref-api";
import { IMarking, scrollSummary } from "src/helpers/scroll-to-node";

interface CustomReadOnlyEditorProps {
  value: string;
  forwardedRef?: MutableRefObject<EditorReadOnlyRefApi | null>;
  extensions?: any;
  editorProps?: EditorProps;
  mentionHighlights?: string[];
  mentionSuggestions?: IMentionSuggestion[];
  handleEditorReady?: (value: boolean) => void;
}

export const useReadOnlyEditor = ({
  value,
  forwardedRef,
  extensions = [],
  editorProps = {},
  handleEditorReady,
  mentionHighlights,
  mentionSuggestions,
}: CustomReadOnlyEditorProps) => {
  const editor = useCustomEditor({
    editable: false,
    content: typeof value === "string" && value.trim() !== "" ? value : "<p></p>",
    editorProps: {
      ...CoreReadOnlyEditorProps,
      ...editorProps,
    },
    onCreate: async () => {
      handleEditorReady?.(true);
    },
    extensions: [
      ...CoreReadOnlyEditorExtensions({
        mentionSuggestions: mentionSuggestions ?? [],
        mentionHighlights: mentionHighlights ?? [],
      }),
      ...extensions,
    ],
    onDestroy: () => {
      handleEditorReady?.(false);
    },
  });

  const editorRef: MutableRefObject<Editor | null> = useRef(null);

  useImperativeHandle(forwardedRef, () => ({
    clearEditor: () => {
      editorRef.current?.commands.clearContent();
    },
    setEditorValue: (content: string) => {
      editorRef.current?.commands.setContent(content);
    },
    getMarkDown: (): string => {
      const markdownOutput = editorRef.current?.storage.markdown.getMarkdown();
      return markdownOutput;
    },
    scrollSummary: (marking: IMarking): void => {
      if (!editorRef.current) return;
      scrollSummary(editorRef.current, marking);
    },
  }));

  if (!editor) {
    return null;
  }

  editorRef.current = editor;
  return editor;
};
