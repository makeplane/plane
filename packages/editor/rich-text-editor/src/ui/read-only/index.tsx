"use client";
import {
  EditorReadOnlyRefApi,
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  IMentionHighlight,
  useReadOnlyEditor,
} from "@plane/editor-core";
import * as React from "react";

export interface IRichTextReadOnlyEditor {
  initialValue: string;
  containerClassName?: string;
  editorClassName?: string;
  tabIndex?: number;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
}

const RichTextReadOnlyEditor = (props: IRichTextReadOnlyEditor) => {
  const { containerClassName, editorClassName = "", initialValue, forwardedRef, mentionHandler } = props;

  const editor = useReadOnlyEditor({
    initialValue,
    editorClassName,
    forwardedRef,
    mentionHandler,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorContainerClassName={editorContainerClassName}>
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} />
      </div>
    </EditorContainer>
  );
};

const RichTextReadOnlyEditorWithRef = React.forwardRef<EditorReadOnlyRefApi, IRichTextReadOnlyEditor>((props, ref) => (
  <RichTextReadOnlyEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>} />
));

RichTextReadOnlyEditorWithRef.displayName = "RichReadOnlyEditorWithRef";

export { RichTextReadOnlyEditor, RichTextReadOnlyEditorWithRef };
