import { forwardRef } from "react";
// types
import { EditorReadOnlyRefApi, IRichTextReadOnlyEditor } from "@/types";
import { ReadOnlyEditorWrapper } from "../read-only-editor-wrapper";

const RichTextReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IRichTextReadOnlyEditor>((props, ref) => (
  <ReadOnlyEditorWrapper {...props} forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>} />
));

RichTextReadOnlyEditorWithRef.displayName = "RichReadOnlyEditorWithRef";

export { RichTextReadOnlyEditorWithRef };
