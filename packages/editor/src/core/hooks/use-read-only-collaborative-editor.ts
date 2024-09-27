import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import { IndexeddbPersistence } from "y-indexeddb";
// extensions
import { HeadingListExtension } from "@/extensions";
// hooks
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// types
import { TReadOnlyCollaborativeEditorProps } from "@/types";

export const useReadOnlyCollaborativeEditor = (props: TReadOnlyCollaborativeEditorProps) => {
  const {
    editorClassName,
    editorProps = {},
    extensions,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    realtimeConfig,
    serverHandler,
    user,
  } = props;
  // states
  const [hasServerConnectionFailed, setHasServerConnectionFailed] = useState(false);
  const [hasServerSynced, setHasServerSynced] = useState(false);
  // initialize Hocuspocus provider
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        url: realtimeConfig.url,
        name: id,
        token: user.id,
        parameters: realtimeConfig.queryParams,
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
    [id, realtimeConfig, user.id]
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

  const editor = useReadOnlyEditor({
    editorProps,
    editorClassName,
    extensions: [
      ...(extensions ?? []),
      HeadingListExtension,
      Collaboration.configure({
        document: provider.document,
      }),
    ],
    forwardedRef,
    handleEditorReady,
    mentionHandler,
    provider,
  });

  return {
    editor,
    hasServerConnectionFailed,
    hasServerSynced,
  };
};
