import type { HocuspocusProvider } from "@hocuspocus/provider";
import Collaboration from "@tiptap/extension-collaboration";
// react
import { useMemo } from "react";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
// hooks
import { useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import type { TCollaborativeEditorHookProps, TEditorHookProps } from "@/types";

type UseCollaborativeEditorArgs = Omit<TCollaborativeEditorHookProps, "realtimeConfig" | "serverHandler" | "user"> & {
  provider: HocuspocusProvider;
  user: TCollaborativeEditorHookProps["user"];
  actions: {
    signalForcedClose: (value: boolean) => void;
  };
};

export const useCollaborativeEditor = (props: UseCollaborativeEditorArgs) => {
  const {
    provider,
    onAssetChange,
    onChange,
    onTransaction,
    disabledExtensions,
    editable,
    editorClassName = "",
    editorProps = {},
    extendedEditorProps,
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    getEditorMetaData,
    handleEditorReady,
    id,
    mentionHandler,
    dragDropEnabled = true,
    isTouchDevice,
    onEditorFocus,
    placeholder,
    tabIndex,
    user,
  } = props;

  // Memoize extensions to avoid unnecessary editor recreations
  const editorExtensions = useMemo(
    () => [
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled,
      }),
      HeadingListExtension,
      Collaboration.configure({
        document: provider.document,
        field: "default",
      }),
      ...extensions,
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        extendedEditorProps,
        fileHandler,
        flaggedExtensions,
        isEditable: editable,
        provider,
        userDetails: user,
      }),
    ],
    [
      provider,
      disabledExtensions,
      dragDropEnabled,
      extensions,
      extendedEditorProps,
      fileHandler,
      flaggedExtensions,
      editable,
      user,
    ]
  );

  // Editor configuration
  const editorConfig = useMemo<TEditorHookProps>(
    () => ({
      disabledExtensions,
      extendedEditorProps,
      id,
      editable,
      editorProps,
      editorClassName,
      enableHistory: false,
      extensions: editorExtensions,
      fileHandler,
      flaggedExtensions,
      forwardedRef,
      getEditorMetaData,
      handleEditorReady,
      isTouchDevice,
      mentionHandler,
      onAssetChange,
      onChange,
      onEditorFocus,
      onTransaction,
      placeholder,
      provider,
      tabIndex,
    }),
    [
      provider,
      disabledExtensions,
      extendedEditorProps,
      id,
      editable,
      editorProps,
      editorClassName,
      editorExtensions,
      fileHandler,
      flaggedExtensions,
      forwardedRef,
      getEditorMetaData,
      handleEditorReady,
      isTouchDevice,
      mentionHandler,
      onAssetChange,
      onChange,
      onEditorFocus,
      onTransaction,
      placeholder,
      tabIndex,
    ]
  );

  const editor = useEditor(editorConfig);

  return {
    editor,
  };
};
