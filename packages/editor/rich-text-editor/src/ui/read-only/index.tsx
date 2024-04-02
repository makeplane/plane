"use client";
import {
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  IMentionHighlight,
  useReadOnlyEditor,
} from "@plane/editor-core";
import * as React from "react";

interface IRichTextReadOnlyEditor {
  value: string;
  editorContentCustomClassNames?: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
  mentionHighlights?: () => Promise<IMentionHighlight[]>;
  tabIndex?: number;
}

interface RichTextReadOnlyEditorProps extends IRichTextReadOnlyEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

const RichReadOnlyEditor = ({
  editorContentCustomClassNames,
  noBorder,
  borderOnFocus,
  customClassName,
  value,
  forwardedRef,
  mentionHighlights,
}: RichTextReadOnlyEditorProps) => {
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

const RichReadOnlyEditorWithRef = React.forwardRef<EditorHandle, IRichTextReadOnlyEditor>((props, ref) => (
  <RichReadOnlyEditor {...props} forwardedRef={ref} />
));

RichReadOnlyEditorWithRef.displayName = "RichReadOnlyEditorWithRef";

export { RichReadOnlyEditor, RichReadOnlyEditorWithRef };
