import { useEditor as useTiptapEditor } from "@tiptap/react";
import { useImperativeHandle, useEffect } from "react";
// extensions
import { CoreReadOnlyEditorExtensions } from "@/extensions";
// helpers
import { getEditorRefHelpers } from "@/helpers/editor-ref";
// props
import { CoreReadOnlyEditorProps } from "@/props";
// types
import type { TReadOnlyEditorHookProps } from "@/types";

export const useReadOnlyEditor = (props: TReadOnlyEditorHookProps) => {
  const {
    disabledExtensions,
    editorClassName = "",
    editorProps = {},
    extensions = [],
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    initialValue,
    mentionHandler,
    provider,
  } = props;

  const editor = useTiptapEditor({
    editable: false,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<p></p>",
    parseOptions: { preserveWhitespace: true },
    editorProps: {
      ...CoreReadOnlyEditorProps({
        editorClassName,
      }),
      ...editorProps,
    },
    onCreate: async () => {
      handleEditorReady?.(true);
    },
    extensions: [
      ...CoreReadOnlyEditorExtensions({
        disabledExtensions,
        fileHandler,
        flaggedExtensions,
        mentionHandler,
      }),
      ...extensions,
    ],
    onDestroy: () => {
      handleEditorReady?.(false);
    },
  });

  // for syncing swr data on tab refocus etc
  useEffect(() => {
    if (initialValue === null || initialValue === undefined) return;
    if (editor && !editor.isDestroyed) editor?.commands.setContent(initialValue, false, { preserveWhitespace: true });
  }, [editor, initialValue]);

  useImperativeHandle(forwardedRef, () => getEditorRefHelpers({ editor, provider }));

  if (!editor) {
    return null;
  }

  return editor;
};
