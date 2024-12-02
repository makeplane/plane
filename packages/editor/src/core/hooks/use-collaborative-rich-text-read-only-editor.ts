import { useEffect, useMemo } from "react";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
// hooks
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// providers
import { CustomCollaborationProvider } from "@/providers";
// types
import { TCollaborativeRichTextReadOnlyEditorHookProps } from "@/types";

export const useCollaborativeRichTextReadOnlyEditor = (props: TCollaborativeRichTextReadOnlyEditorHookProps) => {
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
    value,
  } = props;
  // initialize custom collaboration provider
  const provider = useMemo(
    () =>
      new CustomCollaborationProvider({
        name: id,
      }),
    [id]
  );

  useEffect(() => {
    if (value.length > 0) {
      Y.applyUpdate(provider.document, value);
    }
  }, [value, provider.document]);

  const editor = useReadOnlyEditor({
    disabledExtensions,
    editorProps,
    editorClassName,
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
    providerDocument: provider.document,
  });

  return {
    editor,
  };
};
