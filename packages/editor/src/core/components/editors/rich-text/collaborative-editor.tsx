import React from "react";
// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
import { EditorBubbleMenu } from "@/components/menus";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeRichTextEditor } from "@/hooks/use-collaborative-rich-text-editor";
// types
import { EditorRefApi, ICollaborativeRichTextEditor } from "@/types";

const CollaborativeRichTextEditor = (props: ICollaborativeRichTextEditor) => {
  const {
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName,
    fileHandler,
    forwardedRef,
    id,
    mentionHandler,
    onChange,
    placeholder,
    tabIndex,
    value,
  } = props;

  const { editor } = useCollaborativeRichTextEditor({
    disabledExtensions,
    editorClassName,
    fileHandler,
    forwardedRef,
    id,
    mentionHandler,
    onChange,
    placeholder,
    tabIndex,
    value,
  });

  const editorContainerClassName = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
      id={id}
    >
      <EditorBubbleMenu editor={editor} />
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
      </div>
    </EditorContainer>
  );
};

const CollaborativeRichTextEditorWithRef = React.forwardRef<EditorRefApi, ICollaborativeRichTextEditor>(
  (props, ref) => (
    <CollaborativeRichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
  )
);

CollaborativeRichTextEditorWithRef.displayName = "CollaborativeRichTextEditorWithRef";

export { CollaborativeRichTextEditorWithRef };
