import { useLayoutEffect, useMemo } from "react";
import {
  DeleteImage,
  EditorRefApi,
  IMentionHighlight,
  IMentionSuggestion,
  RestoreImage,
  UploadImage,
  useEditor,
} from "@plane/editor-core";
import * as Y from "yjs";
import { CollaborationProvider } from "src/providers/collaboration-provider";
import { DocumentEditorExtensions } from "src/ui/extensions";
import { IndexeddbPersistence } from "y-indexeddb";
import { EditorProps } from "@tiptap/pm/view";

type DocumentEditorProps = {
  id?: string;
  uploadFile: UploadImage;
  restoreFile: RestoreImage;
  deleteFile: DeleteImage;
  cancelUploadImage?: () => void;
  value: Uint8Array;
  editorClassName: string;
  onChange: (binaryString: string, html: string) => void;
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
  uploadFile,
  id = "",
  deleteFile,
  cancelUploadImage,
  editorProps = {},
  value,
  editorClassName,
  onChange,
  forwardedRef,
  tabIndex,
  restoreFile,
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
    if (value.byteLength !== 0) Y.applyUpdate(provider.document, value);
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
    restoreFile,
    uploadFile,
    deleteFile,
    cancelUploadImage,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    extensions: DocumentEditorExtensions({
      uploadFile,
      setHideDragHandle: setHideDragHandleFunction,
      provider,
    }),
    placeholder,
    tabIndex,
  });

  return editor;
};
