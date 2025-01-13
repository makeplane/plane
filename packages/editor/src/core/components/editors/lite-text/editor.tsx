import { forwardRef, useMemo } from "react";
// components
import { EditorWrapper } from "@/components/editors/editor-wrapper";
// extensions
import { EnterKeyExtension } from "@/extensions";
// types
import { EditorRefApi, ILiteTextEditor } from "@/types";

const LiteTextEditor = (props: ILiteTextEditor) => {
  const { onEnterKeyPress, disabledExtensions, extensions: externalExtensions = [], has_enabled_smooth_cursor } = props;

  const extensions = useMemo(
    () => [
      ...externalExtensions,
      ...(disabledExtensions?.includes("enter-key") ? [] : [EnterKeyExtension(onEnterKeyPress)]),
    ],
    [externalExtensions, disabledExtensions, onEnterKeyPress]
  );

  return <EditorWrapper {...props} extensions={extensions} has_enabled_smooth_cursor={has_enabled_smooth_cursor} />;
};

const LiteTextEditorWithRef = forwardRef<EditorRefApi, ILiteTextEditor>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditorWithRef };
