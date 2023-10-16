"use client"
import { EditorContainer, EditorContentWrapper, getEditorClassNames, useReadOnlyEditor } from '@plane/editor-core';
import * as React from 'react';

interface IRichTextReadOnlyEditor {
  value: string;
  editorContentCustomClassNames?: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
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
}: RichTextReadOnlyEditorProps) => {
  const editor = useReadOnlyEditor({
    value,
    forwardedRef,
  });

  const editorClassNames = getEditorClassNames({ noBorder, borderOnFocus, customClassName });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorClassNames={editorClassNames}>
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
      </div>
    </EditorContainer >
  );
};

const RichReadOnlyEditorWithRef = React.forwardRef<EditorHandle, IRichTextReadOnlyEditor>((props, ref) => (
  <RichReadOnlyEditor {...props} forwardedRef={ref} />
));

RichReadOnlyEditorWithRef.displayName = "RichReadOnlyEditorWithRef";

export { RichReadOnlyEditor , RichReadOnlyEditorWithRef };
