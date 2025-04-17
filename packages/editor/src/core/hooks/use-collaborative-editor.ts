import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
// react
import { useEffect, useMemo, useState } from "react";
// core
// indexeddb
import { IndexeddbPersistence } from "y-indexeddb";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
// helpers
// hooks
import { useEditor } from "@/hooks/use-editor";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { TCollaborativeEditorProps } from "@/types";
import { useEditorNavigation } from "./use-editor-navigation";
import { useTitleEditor } from "./use-title-editor";

/**
 * Hook that creates a collaborative editor with title and main editor components
 * Handles real-time collaboration, local persistence, and keyboard navigation between editors
 */
export const useCollaborativeEditor = (props: TCollaborativeEditorProps) => {
  const {
    onTransaction,
    disabledExtensions,
    editable,
    editorClassName,
    editorProps = {},
    embedHandler,
    extensions,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
    updatePageProperties,
  } = props;

  // Server connection states
  const [hasServerConnectionFailed, setHasServerConnectionFailed] = useState(false);
  const [hasServerSynced, setHasServerSynced] = useState(false);

  // Create keyboard navigation extensions between editors
  const { setTitleEditor, setMainEditor, titleNavigationExtension, mainNavigationExtension } = useEditorNavigation();
  const [isContentInIndexedDb, setIsContentInIndexedDb] = useState(true);
  const [isIndexedDbSynced, setIsIndexedDbSynced] = useState(false);

  // Initialize Hocuspocus provider for real-time collaboration
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        name: id,
        parameters: realtimeConfig.queryParams,
        token: JSON.stringify(user), // Using user id as token for server auth
        url: realtimeConfig.url,
        onAuthenticationFailed: () => {
          serverHandler?.onServerError?.();
          setHasServerConnectionFailed(true);
        },
        onConnect: () => serverHandler?.onConnect?.(),
        onClose: (data) => {
          if (data.event.code === 1006) {
            serverHandler?.onServerError?.();
            setHasServerConnectionFailed(true);
          }
        },
        onSynced: () => {
          serverHandler?.onServerSynced?.();
          provider.sendStateless(
            JSON.stringify({
              action: "synced",
              workspaceSlug: realtimeConfig.queryParams.workspaceSlug,
              projectId: realtimeConfig.queryParams.projectId,
            })
          );
          setHasServerSynced(true);
        },
      }),
    [id, realtimeConfig, serverHandler, user]
  );

  // Initialize local persistence using IndexedDB
  const localProvider = useMemo(
    () => (id ? new IndexeddbPersistence(id, provider.document) : undefined),
    [id, provider]
  );

  useEffect(() => {
    localProvider?.on("synced", () => {
      setIsIndexedDbSynced(true);
      if (localProvider.doc.share.get("default")?._length === 0) {
        setIsContentInIndexedDb(false);
      } else {
        setIsContentInIndexedDb(true);
      }
    });
  }, [localProvider]);

  // Clean up providers on unmount
  useEffect(
    () => () => {
      provider?.destroy();
      localProvider?.destroy();
    },
    [provider, localProvider]
  );

  // Initialize main document editor
  const editor = useEditor({
    embedConfig: embedHandler,
    disabledExtensions,
    id,
    editable,
    editorProps,
    editorClassName,
    enableHistory: false,
    extensions: [
      // Core extensions
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled: true,
      }),
      HeadingListExtension,

      // Collaboration extension
      Collaboration.configure({
        document: provider.document,
        field: "default",
      }),

      // User-provided extensions
      ...(extensions ?? []),

      // Additional document editor extensions
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        embedConfig: embedHandler,
        provider,
        userDetails: user,
      }),

      // Navigation extension for keyboard shortcuts
      mainNavigationExtension,
    ],
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    onTransaction,
    placeholder,
    provider,
    tabIndex,
  });

  // Use the new hook for realtime events
  useRealtimeEvents({
    editor,
    provider,
    id,
    updatePageProperties,
  });

  // Initialize title editor
  const titleEditor = useTitleEditor({
    id: id,
    editable: editable,
    provider,
    forwardedRef,
    updatePageProperties,
    extensions: [
      // Collaboration extension for title field
      Collaboration.configure({
        document: provider.document,
        field: "title",
      }),

      // Navigation extension for keyboard shortcuts
      titleNavigationExtension,
    ],
  });

  // Connect editors for navigation once they're initialized
  useEffect(() => {
    if (editor && titleEditor) {
      setMainEditor(editor);
      setTitleEditor(titleEditor);
    }
  }, [editor, titleEditor, setMainEditor, setTitleEditor]);

  return {
    editor,
    titleEditor,
    hasServerConnectionFailed,
    hasServerSynced,
    isContentInIndexedDb,
    isIndexedDbSynced,
  };
};
