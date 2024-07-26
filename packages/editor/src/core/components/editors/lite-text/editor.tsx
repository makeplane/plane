import { forwardRef } from "react";
// components
import { EditorWrapper } from "@/components/editors/editor-wrapper";
// extensions
import { EnterKeyExtension } from "@/extensions";
// types
import { EditorRefApi, ILiteTextEditor } from "@/types";

const LiteTextEditor = (props: ILiteTextEditor) => {
  const { onEnterKeyPress } = props;

  const extensions = [EnterKeyExtension(onEnterKeyPress)];

  return <EditorWrapper {...props} extensions={extensions} hideDragHandleOnMouseLeave={() => {}} />;
};

const LiteTextEditorWithRef = forwardRef<EditorRefApi, ILiteTextEditor>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditorWithRef };
