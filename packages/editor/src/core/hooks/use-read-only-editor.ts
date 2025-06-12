import { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorProps } from "@tiptap/pm/view";
import { useEditor as useTiptapEditor, Extensions } from "@tiptap/react";
import { useImperativeHandle, MutableRefObject, useEffect } from "react";
import * as Y from "yjs";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { CoreReadOnlyEditorExtensions } from "@/extensions";
// helpers
import { getAllEditorAssets } from "@/helpers/assets";
import { getParagraphCount } from "@/helpers/common";
import { IMarking, scrollSummary } from "@/helpers/scroll-to-node";
// props
import { CoreReadOnlyEditorProps } from "@/props";
// types
import type { EditorReadOnlyRefApi, TExtensions, TReadOnlyFileHandler, TReadOnlyMentionHandler } from "@/types";

interface CustomReadOnlyEditorProps {
  disabledExtensions: TExtensions[];
  editorClassName: string;
  editorProps?: EditorProps;
  extensions?: Extensions;
  forwardedRef?: MutableRefObject<EditorReadOnlyRefApi | null>;
  initialValue?: string;
  fileHandler: TReadOnlyFileHandler;
  handleEditorReady?: (value: boolean) => void;
  mentionHandler: TReadOnlyMentionHandler;
  provider?: HocuspocusProvider;
}

export const useReadOnlyEditor = (props: CustomReadOnlyEditorProps) => {
  const {
    disabledExtensions,
    initialValue,
    editorClassName,
    forwardedRef,
    extensions = [],
    editorProps = {},
    fileHandler,
    handleEditorReady,
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
        mentionHandler,
        fileHandler,
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
    setEditorValue: (content, emitUpdate = false) => {
      editor?.commands.setContent(content, emitUpdate, { preserveWhitespace: true });
    },
    getMarkDown: () => {
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
    scrollSummary: (marking) => {
      if (!editor) return;
      scrollSummary(editor, marking);
    },
    getDocumentInfo: () => ({
      characters: editor.storage?.characterCount?.characters?.() ?? 0,
      paragraphs: getParagraphCount(editor.state),
      words: editor.storage?.characterCount?.words?.() ?? 0,
    }),
    onAssetChange: (callback) => {
      const handleAssetChange = () => {
        if (!editor) return;
        const assets = getAllEditorAssets(editor);
        callback(assets);
      };

      // Subscribe to update assets
      editor?.on("update", handleAssetChange);
      // Return a function to unsubscribe to the continuous transactions of
      // the editor on unmounting the component that has subscribed to this
      // method
      return () => {
        editor?.off("update", handleAssetChange);
      };
    },
  }));

  if (!editor) {
    return null;
  }

  return editor;
};
