import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
// react
import { useEffect, useMemo, useState } from "react";
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
import { TCollaborativeEditorHookProps } from "@/types";
// local imports
import { useEditorNavigation } from "./use-editor-navigation";
import { useTitleEditor } from "./use-title-editor";

export const useCollaborativeEditor = (props: TCollaborativeEditorHookProps) => {
  const {
    onTransaction,
    isSmoothCursorEnabled,
    disabledExtensions,
    editable,
    editorClassName = "",
    editorProps = {},
    embedHandler,
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    titleRef,
    user,
    updatePageProperties,
  } = props;

  // Server connection states
  const [hasServerConnectionFailed, setHasServerConnectionFailed] = useState(false);
  const [hasServerSynced, setHasServerSynced] = useState(false);
  // State to track if initial focus has been set
  const [initialFocusSet, setInitialFocusSet] = useState(false);

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
        onStatus: (status) => {
          if (status.status === "disconnected") {
            serverHandler?.onServerError?.();
            setHasServerConnectionFailed(true);
          }
        },
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
      ...extensions,
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        embedConfig: embedHandler,
        fileHandler,
        flaggedExtensions,
        isEditable: editable,
        provider,
        userDetails: user,
      }),

      // Navigation extension for keyboard shortcuts
      mainNavigationExtension,
    ],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    isSmoothCursorEnabled,
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
    id,
    isSmoothCursorEnabled,
    editable,
    provider,
    titleRef,
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

  // Set initial focus based on title editor content
  useEffect(() => {
    // Ensure editors are initialized, sync has occurred, and initial focus hasn't been set
    if (editor && titleEditor && (hasServerSynced || (isIndexedDbSynced && isContentInIndexedDb)) && !initialFocusSet) {
      if (titleEditor.isEmpty) {
        // Focus the title editor if it's empty
        titleEditor.commands.focus("start");
      } else {
        editor.commands.focus("start");
      }
      // Mark initial focus as set to prevent re-running
      setInitialFocusSet(true);
    }
  }, [editor, titleEditor, hasServerSynced, isIndexedDbSynced, initialFocusSet, isContentInIndexedDb]);

  return {
    editor,
    titleEditor,
    hasServerConnectionFailed,
    hasServerSynced,
    isContentInIndexedDb,
    isIndexedDbSynced,
  };
};
