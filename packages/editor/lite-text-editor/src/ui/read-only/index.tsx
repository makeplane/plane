import * as React from "react";
import {
  EditorContainer,
  EditorContentWrapper,
  EditorReadOnlyRefApi,
  getEditorClassNames,
  IMentionHighlight,
  useReadOnlyEditor,
} from "@plane/editor-document-core";

export interface ILiteTextReadOnlyEditor {
  initialValue: string;
  editorContentCustomClassNames?: string;
  borderOnFocus?: boolean;
  customClassName?: string;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
  tabIndex?: number;
}

const LiteTextReadOnlyEditor = ({
  editorContentCustomClassNames,
  customClassName,
  initialValue,
  forwardedRef,
  mentionHandler,
  tabIndex,
}: ILiteTextReadOnlyEditor) => {
  const editor = useReadOnlyEditor({
    initialValue,
    forwardedRef,
    mentionHandler,
  });

  const editorClassNames = getEditorClassNames({
    customClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorClassNames={editorClassNames}>
      <div className="flex flex-col">
        <EditorContentWrapper
          tabIndex={tabIndex}
          editor={editor}
          editorContentCustomClassNames={editorContentCustomClassNames}
        />
      </div>
    </EditorContainer>
  );
};

const LiteTextReadOnlyEditorWithRef = React.forwardRef<EditorReadOnlyRefApi, ILiteTextReadOnlyEditor>((props, ref) => (
  <LiteTextReadOnlyEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>} />
));

LiteTextReadOnlyEditorWithRef.displayName = "LiteReadOnlyEditorWithRef";

export { LiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef };
