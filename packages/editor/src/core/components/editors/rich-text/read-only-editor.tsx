import { forwardRef, useCallback } from "react";
// plane editor extensions
import { RichTextReadOnlyEditorAdditionalExtensions } from "@/plane-editor/extensions/rich-text/read-only-extensions";
// types
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditorProps } from "@/types";
// local imports
import { ReadOnlyEditorWrapper } from "../read-only-editor-wrapper";

const RichTextReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IRichTextReadOnlyEditorProps>((props, ref) => {
  const { disabledExtensions, fileHandler, flaggedExtensions } = props;

  const getExtensions = useCallback(() => {
    const extensions = RichTextReadOnlyEditorAdditionalExtensions({
      disabledExtensions,
      fileHandler,
      flaggedExtensions,
    });

    return extensions;
  }, [disabledExtensions, fileHandler, flaggedExtensions]);

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
