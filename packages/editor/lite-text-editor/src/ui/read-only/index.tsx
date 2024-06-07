import * as React from "react";
import {
  EditorContainer,
  EditorContentWrapper,
  EditorReadOnlyRefApi,
  getEditorClassNames,
  IMentionHighlight,
  useReadOnlyEditor,
} from "@plane/editor-core";

export interface ILiteTextReadOnlyEditor {
  initialValue: string;
  borderOnFocus?: boolean;
  containerClassName?: string;
  editorClassName?: string;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
  tabIndex?: number;
}

const LiteTextReadOnlyEditor = ({
  containerClassName,
  editorClassName = "",
  initialValue,
  forwardedRef,
  mentionHandler,
  tabIndex,
}: ILiteTextReadOnlyEditor) => {
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
        <EditorContentWrapper tabIndex={tabIndex} editor={editor} />
      </div>
    </EditorContainer>
  );
};

const LiteTextReadOnlyEditorWithRef = React.forwardRef<EditorReadOnlyRefApi, ILiteTextReadOnlyEditor>((props, ref) => (
  <LiteTextReadOnlyEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>} />
));

LiteTextReadOnlyEditorWithRef.displayName = "LiteReadOnlyEditorWithRef";

export { LiteTextReadOnlyEditor, LiteTextReadOnlyEditorWithRef };
