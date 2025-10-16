import { Editor, Extensions } from "@tiptap/core";
// components
import { EditorContainer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// hooks
import { getEditorClassNames } from "@/helpers/common";
import { useEditor } from "@/hooks/use-editor";
// types
import { IEditorProps } from "@/types";
import { EditorContentWrapper } from "./editor-content";

type Props = IEditorProps & {
  children?: (editor: Editor) => React.ReactNode;
  editable: boolean;
  extensions: Extensions;
};

export const EditorWrapper: React.FC<Props> = (props) => {
  const {
    children,
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    editorProps,
    extendedEditorProps,
    extensions,
    id,
    initialValue,
    isTouchDevice,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    mentionHandler,
    onChange,
    onEditorFocus,
    onTransaction,
    handleEditorReady,
    autofocus,
    placeholder,
    tabIndex,
    value,
  } = props;

  const editor = useEditor({
    editable,
    disabledExtensions,
    editorClassName,
    editorProps,
    enableHistory: true,
    extendedEditorProps,
    extensions,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    id,
    isTouchDevice,
    initialValue,
    mentionHandler,
    onChange,
    onEditorFocus,
    onTransaction,
    handleEditorReady,
    autofocus,
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
      isTouchDevice={!!isTouchDevice}
    >
      {children?.(editor)}
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
      </div>
    </EditorContainer>
  );
};
