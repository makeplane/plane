import { useEffect, useLayoutEffect, useMemo } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorProps } from "@tiptap/pm/view";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
// extensions
import { DragAndDrop, SlashCommand } from "@/extensions";
// hooks
import { TFileHandler, useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { IssueWidget } from "@/plane-editor/extensions";
// plane editor provider
import { CollaborationProvider } from "@/plane-editor/providers/collaboration-provider";
// types
import { EditorRefApi, IMentionHighlight, IMentionSuggestion } from "@/types";

type DocumentEditorProps = {
  id: string;
  fileHandler: TFileHandler;
  value: Uint8Array;
  editorClassName: string;
  onChange: (updates: Uint8Array) => void;
  editorProps?: EditorProps;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions?: () => Promise<IMentionSuggestion[]>;
  };
  handleEditorReady?: (value: boolean) => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setHideDragHandleFunction: (hideDragHandlerFromDragDrop: () => void) => void;
  tabIndex?: number;
};

export const useDocumentEditor = (props: DocumentEditorProps) => {
  const {
    id,
    editorProps = {},
    value,
    editorClassName,
    fileHandler,
    onChange,
    forwardedRef,
    tabIndex,
    handleEditorReady,
    mentionHandler,
    placeholder,
    setHideDragHandleFunction,
  } = props;

  const provider = useMemo(
    () =>
      new CollaborationProvider({
        name: id,
        onChange,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  // update document on value change
  useEffect(() => {
    if (value.byteLength > 0) Y.applyUpdate(provider.document, value);
  }, [value, provider.document]);

  // indexedDB provider
  useLayoutEffect(() => {
    const localProvider = new IndexeddbPersistence(id, provider.document);
    localProvider.on("synced", () => {
      provider.setHasIndexedDBSynced(true);
    });
    return () => {
      localProvider?.destroy();
    };
  }, [provider, id]);

  const editor = useEditor({
    id,
    editorProps,
    editorClassName,
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    extensions: [
      SlashCommand(fileHandler.upload),
      DragAndDrop(setHideDragHandleFunction),
      IssueWidget,
      Collaboration.configure({
        document: provider.document,
      }),
    ],
    placeholder,
    tabIndex,
  });

  return editor;
};
