import React from "react";
// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
import { EditorBubbleMenu } from "@/components/menus";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeRichTextReadOnlyEditor } from "@/hooks/use-collaborative-rich-text-read-only-editor";
// types
import { EditorReadOnlyRefApi, ICollaborativeRichTextReadOnlyEditor } from "@/types";

const CollaborativeRichTextReadOnlyEditor = (props: ICollaborativeRichTextReadOnlyEditor) => {
  const {
    containerClassName,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName,
    fileHandler,
    forwardedRef,
    id,
    mentionHandler,
    value,
  } = props;

  const { editor } = useCollaborativeRichTextReadOnlyEditor({
    editorClassName,
    fileHandler,
    forwardedRef,
    id,
    mentionHandler,
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
        <EditorContentWrapper editor={editor} id={id} />
      </div>
    </EditorContainer>
  );
};

const CollaborativeRichTextReadOnlyEditorWithRef = React.forwardRef<
  EditorReadOnlyRefApi,
  ICollaborativeRichTextReadOnlyEditor
>((props, ref) => (
  <CollaborativeRichTextReadOnlyEditor
    {...props}
    forwardedRef={ref as React.MutableRefObject<EditorReadOnlyRefApi | null>}
  />
));

CollaborativeRichTextReadOnlyEditorWithRef.displayName = "CollaborativeRichTextReadOnlyEditorWithRef";

export { CollaborativeRichTextReadOnlyEditorWithRef };
