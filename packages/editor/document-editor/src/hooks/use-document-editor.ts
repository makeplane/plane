import { useLayoutEffect, useMemo } from "react";
import { EditorProps } from "@tiptap/pm/view";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
// editor-core
import { EditorRefApi, IMentionHighlight, IMentionSuggestion, TFileHandler, useEditor } from "@plane/editor-core";
// custom provider
import { CollaborationProvider } from "src/providers/collaboration-provider";
// extensions
import { DocumentEditorExtensions } from "src/ui/extensions";

type DocumentEditorProps = {
  id?: string;
  fileHandler: TFileHandler;
  value: Uint8Array;
  editorClassName: string;
  onChange: (binaryString: string) => void;
  extensions?: any;
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
  id = "",
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

  const yDoc = useMemo(() => {
    if (value.byteLength > 0) Y.applyUpdate(provider.document, value);
    return provider.document;
  }, [value, provider.document]);
  console.log("yDoc", yDoc);

  // indexedDB provider
  useLayoutEffect(() => {
    const localProvider = new IndexeddbPersistence(id, provider.document);
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
    extensions: DocumentEditorExtensions({
      uploadFile: fileHandler.upload,
      setHideDragHandle: setHideDragHandleFunction,
      provider,
    }),
    placeholder,
    tabIndex,
  });

  return editor;
};
