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
    if (value.length > 0) {
      Y.applyUpdate(provider.document, value);
    }
  }, [value, provider.document]);

  const editor = useEditor({
    id,
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
