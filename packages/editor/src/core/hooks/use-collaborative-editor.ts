import { useEffect, useLayoutEffect, useMemo } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorProps } from "@tiptap/pm/view";
import { IndexeddbPersistence } from "y-indexeddb";
// extensions
import { DragAndDrop, IssueWidget } from "@/extensions";
// hooks
import { TFileHandler, useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// plane editor types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import { EditorRefApi, IMentionHighlight, IMentionSuggestion } from "@/types";

type CollaborativeEditorProps = {
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
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  setHideDragHandleFunction: (hideDragHandlerFromDragDrop: () => void) => void;
  tabIndex?: number;
};

export const useCollaborativeEditor = (props: CollaborativeEditorProps) => {
  const {
    editorClassName,
    editorProps = {},
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    setHideDragHandleFunction,
    tabIndex,
  } = props;
  // initialize provider using Hocuspocus
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        url: "http://192.168.68.91:1234/collaboration?workspaceSlug=aaryan&projectId=23a09309-c139-4483-813e-ca5db250cbf6",
        name: id,
      }),
    [id]
  );
  // destroy and disconnect connection on unmount
  useEffect(
    () => () => {
      provider.destroy();
      provider.disconnect();
    },
    [provider]
  );
  // indexed db integration for offline support
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
    extensions: [
      DragAndDrop(setHideDragHandleFunction),
      embedHandler?.issue &&
        IssueWidget({
          widgetCallback: embedHandler.issue.widgetCallback,
        }),
      Collaboration.configure({
        document: provider.document,
      }),
      ...DocumentEditorAdditionalExtensions({
        fileHandler,
        issueEmbedConfig: embedHandler?.issue,
      }),
    ],
    placeholder,
    tabIndex,
  });

  return { editor, isIndexedDbSynced: true };
};
