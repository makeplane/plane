"use client";
import {
  EditorReadOnlyRefApi,
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  IMentionHighlight,
  useReadOnlyEditor,
} from "@plane/editor-document-core";
import * as React from "react";

export interface IRichTextReadOnlyEditor {
  initialValue: string;
  editorContentCustomClassNames?: string;
  customClassName?: string;
  mentionHighlights?: () => Promise<IMentionHighlight[]>;
  tabIndex?: number;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
}

const RichTextReadOnlyEditor = (props: IRichTextReadOnlyEditor) => {
  const { editorContentCustomClassNames, customClassName, initialValue, forwardedRef, mentionHighlights } = props;

  const editor = useReadOnlyEditor({
    initialValue,
    forwardedRef,
    mentionHighlights,
  });

  const editorClassNames = getEditorClassNames({
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

const RichTextReadOnlyEditorWithRef = React.forwardRef<EditorReadOnlyRefApi, IRichTextReadOnlyEditor>((props, ref) => (
  <RichTextReadOnlyEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>} />
));

RichTextReadOnlyEditorWithRef.displayName = "RichReadOnlyEditorWithRef";

export { RichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef };
