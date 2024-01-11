import * as React from "react";
import { EditorContainer, EditorContentWrapper, getEditorClassNames, useReadOnlyEditor } from "@plane/editor-core";

export type ILiteReadOnlyEditor = {
  value: string;
  editorContentCustomClassNames?: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
  mentionHighlights: string[];
};

export interface LiteTextEditorReadOnlyProps extends ILiteReadOnlyEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

const LiteReadOnlyEditor = ({
  editorContentCustomClassNames,
  noBorder,
  borderOnFocus,
  customClassName,
  value,
  forwardedRef,
  mentionHighlights,
}: LiteTextEditorReadOnlyProps) => {
  const editor = useReadOnlyEditor({
    value,
    forwardedRef,
    mentionHighlights,
  });

  const editorClassNames = getEditorClassNames({
    noBorder,
    borderOnFocus,
    customClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorClassNames={editorClassNames}>
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
      </div>
    </EditorContainer>
  );
};

const LiteReadOnlyEditorWithRef = React.forwardRef<EditorHandle, ILiteReadOnlyEditor>((props, ref) => (
  <LiteReadOnlyEditor {...props} forwardedRef={ref} />
));

LiteReadOnlyEditorWithRef.displayName = "LiteReadOnlyEditorWithRef";

export { LiteReadOnlyEditor, LiteReadOnlyEditorWithRef };
