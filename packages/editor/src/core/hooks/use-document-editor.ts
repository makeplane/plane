import { useEffect, useLayoutEffect, useMemo } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorProps } from "@tiptap/pm/view";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
// extensions
import { DragAndDrop, IssueWidget, SlashCommand } from "@/extensions";
// hooks
import { TFileHandler, useEditor } from "@/hooks/use-editor";
// plane editor provider
import { CollaborationProvider } from "@/plane-editor/providers";
// plane editor types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import { EditorRefApi, IMentionHighlight, IMentionSuggestion } from "@/types";

type DocumentEditorProps = {
  editorClassName: string;
  editorProps?: EditorProps;
  embedHandler?: TEmbedConfig;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions?: () => Promise<IMentionSuggestion[]>;
  };
  onChange: (updates: Uint8Array) => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setHideDragHandleFunction: (hideDragHandlerFromDragDrop: () => void) => void;
  tabIndex?: number;
  value: Uint8Array;
};

export const useDocumentEditor = (props: DocumentEditorProps) => {
  const {
    editorClassName,
    editorProps = {},
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    onChange,
    placeholder,
    setHideDragHandleFunction,
    tabIndex,
    value,
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
      embedHandler?.issue &&
        IssueWidget({
          widgetCallback: embedHandler.issue.widgetCallback,
        }),
      Collaboration.configure({
        document: provider.document,
      }),
    ],
    placeholder,
    tabIndex,
  });

  return editor;
};
