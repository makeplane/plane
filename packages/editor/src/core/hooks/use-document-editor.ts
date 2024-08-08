import { useLayoutEffect, useMemo, useState } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorProps } from "@tiptap/pm/view";
import * as Y from "yjs";
// extensions
import { IssueWidget, SideMenuExtension } from "@/extensions";
// hooks
import { TFileHandler, useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// plane editor provider
import { CollaborationProvider } from "@/plane-editor/providers";
// plane editor types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import { EditorRefApi, IMentionHighlight, IMentionSuggestion, TExtensions } from "@/types";

type DocumentEditorProps = {
  disabledExtensions?: TExtensions[];
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
  tabIndex?: number;
  value: Uint8Array;
};

export const useDocumentEditor = (props: DocumentEditorProps) => {
  const {
    disabledExtensions,
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

  const [isIndexedDbSynced, setIndexedDbIsSynced] = useState(false);

  // update document on value change from server
  useLayoutEffect(() => {
    if (value.length > 0) {
      Y.applyUpdate(provider.document, value);
    }
  }, [value, provider.document, id]);

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
    enableHistory: false,
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    extensions: [
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled: true,
      }),
      embedHandler?.issue &&
        IssueWidget({
          widgetCallback: embedHandler.issue.widgetCallback,
        }),
      Collaboration.configure({
        document: provider.document,
      }),
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        fileHandler,
        issueEmbedConfig: embedHandler?.issue,
      }),
    ],
    placeholder,
    provider,
    tabIndex,
  });

  return {
    editor,
    isIndexedDbSynced,
  };
};
