import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import { IndexeddbPersistence } from "y-indexeddb";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
// hooks
import { useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { TCollaborativeEditorProps } from "@/types";
// import { Collaboration } from "@/extensions/collaboration";

export const useCollaborativeEditor = (props: TCollaborativeEditorProps) => {
  const {
    onTransaction,
    disabledExtensions,
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
  } = props;
  // states
  const [hasServerConnectionFailed, setHasServerConnectionFailed] = useState(false);
  const [hasServerSynced, setHasServerSynced] = useState(false);
  // initialize Hocuspocus provider
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        name: id,
        parameters: realtimeConfig.queryParams,
        // using user id as a token to verify the user on the server
        token: JSON.stringify(user),
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
        onSynced: () => setHasServerSynced(true),
      }),
    [id, realtimeConfig, serverHandler, user]
  );

  // destroy and disconnect connection on unmount
  useEffect(
    () => () => {
      provider.destroy();
      provider.disconnect();
    },
    [provider]
  );

  // const localProvider = useMemo(() => new IndexeddbPersistence(id, provider.document), [id, provider]);
  // indexed db integration for offline support
  // useLayoutEffect(
  //   () => () => {
  //     localProvider?.destroy();
  //   },
  //   [localProvider, id]
  // );

  const editor = useEditor({
    id,
    onTransaction,
    editorProps,
    editorClassName,
    enableHistory: false,
    extensions: [
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled: true,
      }),
      HeadingListExtension,
      Collaboration.configure({
        document: provider.document,
      }),
      ...(extensions ?? []),
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        issueEmbedConfig: embedHandler?.issue,
        provider,
        userDetails: user,
      }),
    ],
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    placeholder,
    provider,
    // localProvider,
    tabIndex,
  });

  return {
    editor,
    hasServerConnectionFailed,
    hasServerSynced,
  };
};
