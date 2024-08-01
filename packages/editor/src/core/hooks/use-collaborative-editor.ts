import { useEffect, useLayoutEffect, useMemo } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
import { IndexeddbPersistence } from "y-indexeddb";
// extensions
import { DragAndDrop } from "@/extensions";
// hooks
import { useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { TCollaborativeEditorProps } from "@/types";

export const useCollaborativeEditor = (props: TCollaborativeEditorProps) => {
  const {
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
    setHideDragHandleFunction,
    tabIndex,
    user,
  } = props;
  // initialize Hocuspocus provider
  const provider = useMemo(
    () =>
      new HocuspocusProvider({
        name: id,
        parameters: realtimeConfig.queryParams,
        // using user id as a token to verify the user on the server
        token: user.id,
        url: realtimeConfig.url,
        onConnect: () => serverHandler?.onConnect?.(),
        onClose: (data) => {
          if (data.event.code === 1006) serverHandler?.onServerError?.();
        },
      }),
    [id, realtimeConfig, serverHandler, user.id]
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
    enableHistory: false,
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    extensions: [
      DragAndDrop(setHideDragHandleFunction),
      Collaboration.configure({
        document: provider.document,
      }),
      ...(extensions ?? []),
      ...DocumentEditorAdditionalExtensions({
        fileHandler,
        issueEmbedConfig: embedHandler?.issue,
      }),
    ],
    placeholder,
    tabIndex,
  });

  return { editor };
};
