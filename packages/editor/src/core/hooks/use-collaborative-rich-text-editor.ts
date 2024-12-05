import { useEffect, useMemo } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
// hooks
import { useEditor } from "@/hooks/use-editor";
// providers
import { CustomCollaborationProvider } from "@/providers";
// types
import { TCollaborativeRichTextEditorHookProps } from "@/types";

export const useCollaborativeRichTextEditor = (props: TCollaborativeRichTextEditorHookProps) => {
  const {
    disabledExtensions,
    editorClassName,
    editorProps = {},
    extensions,
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
  // initialize custom collaboration provider
  const provider = useMemo(
    () =>
      new CustomCollaborationProvider({
        name: id,
        onChange,
      }),
    [id]
  );

  useEffect(() => {
    if (provider.hasSynced) return;
    if (value && value.length > 0) {
      try {
        Y.applyUpdate(provider.document, value);
        provider.hasSynced = true;
      } catch (error) {
        console.error("Error applying binary updates to the description", error);
      }
    }
  }, [value, provider.document]);

  const editor = useEditor({
    id,
    disabledExtensions,
    editorProps,
    editorClassName,
    enableHistory: false,
    extensions: [
      SideMenuExtension({
        aiEnabled: false,
        dragDropEnabled: true,
      }),
      HeadingListExtension,
      Collaboration.configure({
        document: provider.document,
      }),
      ...(extensions ?? []),
    ],
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    placeholder,
    providerDocument: provider.document,
    tabIndex,
  });

  return {
    editor,
  };
};
