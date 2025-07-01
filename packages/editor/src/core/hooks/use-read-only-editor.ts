import { useEditor as useTiptapEditor } from "@tiptap/react";
import { useImperativeHandle, useEffect } from "react";
import * as Y from "yjs";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { CoreReadOnlyEditorExtensions } from "@/extensions";
// helpers
import { getParagraphCount } from "@/helpers/common";
import { IMarking, scrollSummary } from "@/helpers/scroll-to-node";
// props
import { CoreReadOnlyEditorProps } from "@/props";
// types
import type { TReadOnlyEditorHookProps } from "@/types";

export const useReadOnlyEditor = (props: TReadOnlyEditorHookProps) => {
  const {
    disabledExtensions,
    editorClassName = "",
    editorProps = {},
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    initialValue,
    mentionHandler,
    provider,
  } = props;

  const editor = useTiptapEditor({
    editable: false,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<p></p>",
    parseOptions: { preserveWhitespace: true },
    editorProps: {
      ...CoreReadOnlyEditorProps({
        editorClassName,
      }),
      ...editorProps,
    },
    onCreate: async () => {
      handleEditorReady?.(true);
    },
    extensions: [
      ...CoreReadOnlyEditorExtensions({
        disabledExtensions,
        fileHandler,
        flaggedExtensions,
        mentionHandler,
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
    if (editor && !editor.isDestroyed) editor?.commands.setContent(initialValue, false, { preserveWhitespace: true });
  }, [editor, initialValue]);

  useImperativeHandle(forwardedRef, () => ({
    clearEditor: (emitUpdate = false) => {
      editor?.chain().setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true).clearContent(emitUpdate).run();
    },
    setEditorValue: (content: string, emitUpdate = false) => {
      editor?.commands.setContent(content, emitUpdate, { preserveWhitespace: true });
    },
    getMarkDown: (): string => {
      const markdownOutput = editor?.storage.markdown.getMarkdown();
      return markdownOutput;
    },
    getDocument: () => {
      const documentBinary = provider?.document ? Y.encodeStateAsUpdate(provider?.document) : null;
      const documentHTML = editor?.getHTML() ?? "<p></p>";
      const documentJSON = editor?.getJSON() ?? null;

      return {
        binary: documentBinary,
        html: documentHTML,
        json: documentJSON,
      };
    },
    scrollSummary: (marking: IMarking): void => {
      if (!editor) return;
      scrollSummary(editor, marking);
    },
    getDocumentInfo: () => ({
      characters: editor.storage?.characterCount?.characters?.() ?? 0,
      paragraphs: getParagraphCount(editor.state),
      words: editor.storage?.characterCount?.words?.() ?? 0,
    }),
  }));

  if (!editor) {
    return null;
  }

  return editor;
};
