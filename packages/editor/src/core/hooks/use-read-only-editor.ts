import { HocuspocusProvider } from "@hocuspocus/provider";
import { EditorProps } from "@tiptap/pm/view";
import { useEditor as useCustomEditor, Extensions } from "@tiptap/react";
import { useImperativeHandle, MutableRefObject, useEffect } from "react";
import * as Y from "yjs";
// extensions
import { CoreReadOnlyEditorExtensions } from "@/extensions";
// helpers
import { getParagraphCount } from "@/helpers/common";
import { IMarking, scrollSummary } from "@/helpers/scroll-to-node";
// props
import { CoreReadOnlyEditorProps } from "@/props";
// types
import type {
  EditorReadOnlyRefApi,
  TExtensions,
  TDocumentEventsServer,
  TFileHandler,
  TReadOnlyMentionHandler,
} from "@/types";

interface CustomReadOnlyEditorProps {
  disabledExtensions: TExtensions[];
  editorClassName: string;
  editorProps?: EditorProps;
  extensions?: Extensions;
  forwardedRef?: MutableRefObject<EditorReadOnlyRefApi | null>;
  initialValue?: string;
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
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

  const editor = useCustomEditor({
    editable: false,
    content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<p></p>",
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
    if (editor && !editor.isDestroyed) editor?.commands.setContent(initialValue, false, { preserveWhitespace: "full" });
  }, [editor, initialValue]);

  useImperativeHandle(forwardedRef, () => ({
    clearEditor: (emitUpdate = false) => {
      editor?.chain().setMeta("skipImageDeletion", true).clearContent(emitUpdate).run();
    },
    setEditorValue: (content: string) => {
      editor?.commands.setContent(content, false, { preserveWhitespace: "full" });
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
    getDocumentInfo: () => {
      if (!editor) return;
      return {
        characters: editor.storage?.characterCount?.characters?.() ?? 0,
        paragraphs: getParagraphCount(editor.state),
        words: editor.storage?.characterCount?.words?.() ?? 0,
      };
    },
    onHeadingChange: (callback: (headings: IMarking[]) => void) => {
      // Subscribe to update event emitted from headers extension
      editor?.on("update", () => {
        callback(editor?.storage.headingList.headings);
      });
      // Return a function to unsubscribe to the continuous transactions of
      // the editor on unmounting the component that has subscribed to this
      // method
      return () => {
        editor?.off("update");
      };
    },
    emitRealTimeUpdate: (message: TDocumentEventsServer) => provider?.sendStateless(message),
    listenToRealTimeUpdate: () => provider && { on: provider.on.bind(provider), off: provider.off.bind(provider) },
    getHeadings: () => editor?.storage.headingList.headings,
  }));

  if (!editor) {
    return null;
  }

  return editor;
};
