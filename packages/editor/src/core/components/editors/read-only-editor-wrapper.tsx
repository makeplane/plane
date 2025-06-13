// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// types
import { IReadOnlyEditorProps } from "@/types";

export const ReadOnlyEditorWrapper = (props: IReadOnlyEditorProps) => {
  const {
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    extensions,
    fileHandler,
    forwardedRef,
    id,
    initialValue,
    isMobile = false,
    mentionHandler,
  } = props;

  const editor = useReadOnlyEditor({
    disabledExtensions,
    editorClassName,
    extensions,
    fileHandler,
    forwardedRef,
    initialValue,
    mentionHandler,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
      id={id}
      isMobile={isMobile}
    >
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} id={id} />
      </div>
    </EditorContainer>
  );
};
