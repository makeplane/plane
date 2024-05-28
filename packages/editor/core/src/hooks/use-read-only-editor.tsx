import { useEditor as useCustomEditor, Editor } from "@tiptap/react";
import { useImperativeHandle, useRef, MutableRefObject, useEffect } from "react";
import { CoreReadOnlyEditorExtensions } from "src/ui/read-only/extensions";
import { CoreReadOnlyEditorProps } from "src/ui/read-only/props";
import { EditorProps } from "@tiptap/pm/view";
import { EditorReadOnlyRefApi } from "src/types/editor-ref-api";
import { IMarking, scrollSummary } from "src/helpers/scroll-to-node";
import { IMentionHighlight } from "src/types/mention-suggestion";

interface CustomReadOnlyEditorProps {
  initialValue: string;
  editorClassName: string;
  forwardedRef?: MutableRefObject<EditorReadOnlyRefApi | null>;
  extensions?: any;
  editorProps?: EditorProps;
  handleEditorReady?: (value: boolean) => void;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
}

export const useReadOnlyEditor = ({
  initialValue,
  editorClassName,
  forwardedRef,
  extensions = [],
  editorProps = {},
  handleEditorReady,
  mentionHandler,
}: CustomReadOnlyEditorProps) => {
  const editor = useCustomEditor({
    editable: false,
    content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<p></p>",
    editorProps: {
      ...CoreReadOnlyEditorProps(editorClassName),
      ...editorProps,
    },
    onCreate: async () => {
      handleEditorReady?.(true);
    },
    extensions: [
      ...CoreReadOnlyEditorExtensions({
        mentionHighlights: mentionHandler.highlights,
      }),
      ...extensions,
    ],
    onDestroy: () => {
      handleEditorReady?.(false);
    },
  });

  // for syncing swr data on tab refocus etc
  useEffect(() => {
    if (initialValue === null || initialValue === undefined) return;
    if (editor && !editor.isDestroyed) editor?.commands.setContent(initialValue);
  }, [editor, initialValue]);

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
    getHTML: (): string => {
      const htmlOutput = editorRef.current?.getHTML() ?? "<p></p>";
      return htmlOutput;
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
