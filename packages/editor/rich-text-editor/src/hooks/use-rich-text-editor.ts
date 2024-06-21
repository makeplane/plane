import { useEffect, useMemo, useState } from "react";
import { EditorProps } from "@tiptap/pm/view";
// editor-core
import { EditorRefApi, IMentionHighlight, IMentionSuggestion, TFileHandler, useEditor } from "@plane/editor-core";
// custom provider
import { CollaborationProvider } from "src/providers/collaboration-provider";
// extensions
import { RichTextEditorExtensions } from "src/ui/extensions";
// yjs
import * as Y from "yjs";

type DocumentEditorProps = {
  id: string;
  fileHandler: TFileHandler;
  value: { descriptionYJS: Uint8Array; updateId: string };
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
  dragDropEnabled?: boolean;
  indexedDBPrefix: string;
};

export const useRichTextEditor = ({
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
  dragDropEnabled,
  indexedDBPrefix,
}: DocumentEditorProps) => {
  const provider = useMemo(
    () =>
      new CollaborationProvider({
        name: id,
        onChange,
        indexedDBPrefix,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  );

  const [isIndexedDbSynced, setIndexedDbIsSynced] = useState(false);

  // update document on value change from server
  useEffect(() => {
    console.log("id in useEffect", provider.configuration.name === value.updateId);
    if (value.descriptionYJS.length > 0) {
      Y.applyUpdate(provider.document, value.descriptionYJS);
    }
  }, [value, provider.document, id]);
  // console.log("id out useEffect", id);

  // watch for indexedDb to complete syncing, only after which the editor is
  // rendered
  useEffect(() => {
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
    extensions: RichTextEditorExtensions({
      uploadFile: fileHandler.upload,
      dragDropEnabled,
      setHideDragHandle: setHideDragHandleFunction,
      provider,
    }),
    provider,
    placeholder,
    tabIndex,
  });

  return { editor, isIndexedDbSynced };
};
