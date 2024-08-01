import { useEffect, useLayoutEffect, useMemo } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import { IndexeddbPersistence } from "y-indexeddb";
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
  // initialize Hocuspocus provider
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        url: realtimeConfig.url,
        name: id,
        token: user.id,
        parameters: realtimeConfig.queryParams,
        onConnect: () => serverHandler?.onConnect?.(),
        onClose: (data) => {
          if (data.event.code === 1006) serverHandler?.onServerError?.();
        },
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
    forwardedRef,
    handleEditorReady,
    mentionHandler,
    extensions: [
      ...(extensions ?? []),
      Collaboration.configure({
        document: provider.document,
      }),
    ],
  });

  return { editor, isIndexedDbSynced: true };
};
