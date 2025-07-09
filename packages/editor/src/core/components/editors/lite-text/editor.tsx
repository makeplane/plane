import { forwardRef, useMemo } from "react";
// extensions
import { EnterKeyExtension } from "@/extensions/enter-key";
// types
import type { EditorRefApi, ILiteTextEditorProps } from "@/types";
// local imports
import { EditorWrapper } from "../editor-wrapper";

const LiteTextEditor: React.FC<ILiteTextEditorProps> = (props) => {
  const { onEnterKeyPress, disabledExtensions, extensions: externalExtensions = [] } = props;

  const extensions = useMemo(() => {
    const resolvedExtensions = [...externalExtensions];

    if (!disabledExtensions?.includes("enter-key")) {
      resolvedExtensions.push(EnterKeyExtension(onEnterKeyPress));
    }

    return resolvedExtensions;
  }, [externalExtensions, disabledExtensions, onEnterKeyPress]);

  return <EditorWrapper {...props} editable extensions={extensions} />;
};

const LiteTextEditorWithRef = forwardRef<EditorRefApi, ILiteTextEditorProps>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditorWithRef };
