import { forwardRef } from "react";
// components
import { ReadOnlyEditorWrapper } from "@/components/editors";
// types
import { EditorReadOnlyRefApi, ILiteTextReadOnlyEditorProps } from "@/types";

const LiteTextReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, ILiteTextReadOnlyEditorProps>((props, ref) => (
  <ReadOnlyEditorWrapper {...props} forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>} />
));

LiteTextReadOnlyEditorWithRef.displayName = "LiteReadOnlyEditorWithRef";

export { LiteTextReadOnlyEditorWithRef };
