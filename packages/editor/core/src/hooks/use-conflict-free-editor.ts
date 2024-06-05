import { useEffect, useLayoutEffect, useMemo } from "react";
import { EditorProps } from "@tiptap/pm/view";
import { IndexeddbPersistence } from "y-indexeddb";
import * as Y from "yjs";
import { EditorRefApi, IMentionHighlight, IMentionSuggestion, TFileHandler, useEditor } from "src";
// custom provider
import { CollaborationProvider } from "src/providers/collaboration-provider";

type DocumentEditorProps = {
  id: string;
  fileHandler: TFileHandler;
  value: Uint8Array;
  extensions?: any;
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
  tabIndex?: number;
};

export const useConflictFreeEditor = ({
  id,
  editorProps = {},
  value,
  extensions,
  editorClassName,
  fileHandler,
  onChange,
  forwardedRef,
  tabIndex,
  handleEditorReady,
  mentionHandler,
  placeholder,
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

  // update document on value change
  useEffect(() => {
    if (value.byteLength > 0) Y.applyUpdate(provider.document, value);
  }, [value, provider.document]);

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
    extensions,
    placeholder,
    tabIndex,
  });

  return editor;
};
