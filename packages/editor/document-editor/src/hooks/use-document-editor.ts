import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { EditorProps } from "@tiptap/pm/view";
// editor-core
import { EditorRefApi, IMentionHighlight, IMentionSuggestion, TFileHandler, useEditor } from "@plane/editor-core";
// custom provider
import { CollaborationProvider } from "src/providers/collaboration-provider";
// extensions
import { DocumentEditorExtensions } from "src/ui/extensions";
// yjs
import * as Y from "yjs";

type DocumentEditorProps = {
  id: string;
  fileHandler: TFileHandler;
  value: Uint8Array;
  editorClassName: string;
  onChange: (update: Uint8Array, source?: string) => void;
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

export const useDocumentEditor = ({
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
}: DocumentEditorProps) => {
  const provider = useMemo(
    () =>
      new CollaborationProvider({
        name: id,
        onChange,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  const [isIndexedDbSynced, setIndexedDbIsSynced] = useState(false);

  // update document on value change from server
  useEffect(() => {
    if (value.byteLength > 0) {
      Y.applyUpdate(provider.document, value);
    }
  }, [value, provider.document]);

  // watch for indexedDb to complete syncing, only after which the editor is
  // rendered
  useLayoutEffect(() => {
    async function checkIndexDbSynced() {
      const hasSynced = await provider.hasIndexedDBSynced();
      setIndexedDbIsSynced(hasSynced);
    }
    checkIndexDbSynced();
    return () => {
      setIndexedDbIsSynced(false);
    };
  }, [provider]);

  const editor = useEditor({
    id,
    editorProps,
    editorClassName,
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    extensions: DocumentEditorExtensions({
      uploadFile: fileHandler.upload,
      setHideDragHandle: setHideDragHandleFunction,
      provider,
    }),
    provider,
    placeholder,
    tabIndex,
  });

  return { editor, isIndexedDbSynced };
};
