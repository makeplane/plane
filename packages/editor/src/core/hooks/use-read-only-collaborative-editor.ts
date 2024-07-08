import { useEffect, useLayoutEffect, useMemo } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import { EditorProps } from "@tiptap/pm/view";
import { IndexeddbPersistence } from "y-indexeddb";
// types
import { EditorReadOnlyRefApi, IMentionHighlight, TRealtimeConfig, TUserDetails } from "@/types";
// hooks
import { useReadOnlyEditor } from "./use-read-only-editor";

type ReadOnlyCollaborativeEditorProps = {
  editorClassName: string;
  editorProps?: EditorProps;
  extensions?: Extensions;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
  realtimeConfig: TRealtimeConfig;
  user: TUserDetails;
};

export const useReadOnlyCollaborativeEditor = (props: ReadOnlyCollaborativeEditorProps) => {
  const {
    editorClassName,
    editorProps = {},
    extensions,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    realtimeConfig,
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
