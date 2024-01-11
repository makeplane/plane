import * as React from "react";
import { EditorContainer, EditorContentWrapper, getEditorClassNames, useReadOnlyEditor } from "@plane/editor-core";

export type ILiteTextReadOnlyEditor = {
  value: string;
  editorContentCustomClassNames?: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
  mentionHighlights: string[];
};

export interface LiteTextReadOnlyEditorProps extends ILiteTextReadOnlyEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

const LiteTextReadOnlyEditor = ({
  editorContentCustomClassNames,
  noBorder,
  borderOnFocus,
  customClassName,
  value,
  forwardedRef,
  mentionHighlights,
}: LiteTextReadOnlyEditorProps) => {
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

const LiteTextReadOnlyEditorWithRef = React.forwardRef<EditorHandle, ILiteTextReadOnlyEditor>((props, ref) => (
  <LiteTextReadOnlyEditor {...props} forwardedRef={ref} />
));

LiteTextReadOnlyEditorWithRef.displayName = "LiteTextReadOnlyEditorWithRef";

export { LiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef };
