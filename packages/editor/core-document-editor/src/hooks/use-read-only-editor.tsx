import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import { useImperativeHandle, useRef, MutableRefObject } from "react";
import { CoreReadOnlyEditorExtensions } from "src/ui/read-only/extensions";
import { CoreReadOnlyEditorProps } from "src/ui/read-only/props";
import { EditorProps } from "@tiptap/pm/view";
import { EditorReadOnlyRefApi } from "src/types/editor-ref-api";
import { IMarking, scrollSummary } from "src/helpers/scroll-to-node";
import { IMentionHighlight } from "src/types/mention-suggestion";

interface CustomReadOnlyEditorProps {
  value: string;
  forwardedRef?: MutableRefObject<EditorReadOnlyRefApi | null>;
  extensions?: any;
  editorProps?: EditorProps;
  handleEditorReady?: (value: boolean) => void;
  mentionHighlights?: () => Promise<IMentionHighlight[]>;
}

export const useReadOnlyEditor = ({
  value,
  forwardedRef,
  extensions = [],
  editorProps = {},
  handleEditorReady,
  mentionHighlights,
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
        mentionHighlights: mentionHighlights,
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
