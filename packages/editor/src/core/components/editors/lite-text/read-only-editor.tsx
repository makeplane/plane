import { forwardRef } from "react";
// types
import type { EditorReadOnlyRefApi, ILiteTextReadOnlyEditorProps } from "@/types";
// local imports
import { ReadOnlyEditorWrapper } from "../read-only-editor-wrapper";

const LiteTextReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, ILiteTextReadOnlyEditorProps>((props, ref) => (
  <ReadOnlyEditorWrapper {...props} forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>} />
));

LiteTextReadOnlyEditorWithRef.displayName = "LiteReadOnlyEditorWithRef";

export { LiteTextReadOnlyEditorWithRef };
