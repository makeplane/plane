import { forwardRef, useMemo } from "react";
// components
import { EditorWrapper } from "@/components/editors/editor-wrapper";
// extensions
import { EnterKeyExtension } from "@/extensions";
// types
import { EditorRefApi, ILiteTextEditorProps } from "@/types";

const LiteTextEditor: React.FC<ILiteTextEditorProps> = (props) => {
  const { onEnterKeyPress, disabledExtensions, extensions: externalExtensions = [] } = props;

  const extensions = useMemo(() => {
    const resolvedExtensions = [...externalExtensions];

    if (!disabledExtensions?.includes("enter-key")) {
      resolvedExtensions.push(EnterKeyExtension(onEnterKeyPress));
    }

    return resolvedExtensions;
  }, [externalExtensions, disabledExtensions, onEnterKeyPress]);

  return <EditorWrapper {...props} extensions={extensions} />;
};

const LiteTextEditorWithRef = forwardRef<EditorRefApi, ILiteTextEditorProps>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditorWithRef };
