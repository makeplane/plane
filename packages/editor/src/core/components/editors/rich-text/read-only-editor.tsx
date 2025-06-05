import { forwardRef, useCallback } from "react";
// plane editor extensions
import { RichTextReadOnlyEditorAdditionalExtensions } from "@/plane-editor/extensions/rich-text/read-only-extensions";
// types
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor } from "@/types";
// local imports
import { ReadOnlyEditorWrapper } from "../read-only-editor-wrapper";

const RichTextReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IRichTextReadOnlyEditor>((props, ref) => {
  const { disabledExtensions, fileHandler } = props;

  const getExtensions = useCallback(() => {
    const extensions = [
      ...RichTextReadOnlyEditorAdditionalExtensions({
        disabledExtensions,
        fileHandler,
      }),
    ];

    return extensions;
  }, [disabledExtensions, fileHandler]);

  return (
    <ReadOnlyEditorWrapper
      {...props}
      extensions={getExtensions()}
      forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>}
    />
  );
});

RichTextReadOnlyEditorWithRef.displayName = "RichReadOnlyEditorWithRef";

export { RichTextReadOnlyEditorWithRef };
