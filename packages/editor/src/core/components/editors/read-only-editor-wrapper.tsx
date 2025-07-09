// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// types
import type { IReadOnlyEditorProps } from "@/types";
// local imports
import { EditorContainer } from "./editor-container";
import { EditorContentWrapper } from "./editor-content";

export const ReadOnlyEditorWrapper = (props: IReadOnlyEditorProps) => {
  const {
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    extensions,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    id,
    initialValue,
    mentionHandler,
  } = props;

  const editor = useReadOnlyEditor({
    disabledExtensions,
    editorClassName,
    extensions,
    fileHandler,
    flaggedExtensions,
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
    >
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} />
      </div>
    </EditorContainer>
  );
};
