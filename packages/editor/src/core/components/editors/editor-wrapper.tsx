import type { Editor, Extensions } from "@tiptap/core";
// components
import { EditorContainer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// hooks
import { getEditorClassNames } from "@/helpers/common";
import { useEditor } from "@/hooks/use-editor";
// types
import type { IEditorProps } from "@/types";
import { EditorContentWrapper } from "./editor-content";

type Props = IEditorProps & {
  children?: (editor: Editor) => React.ReactNode;
  editable: boolean;
  extensions: Extensions;
};

export function EditorWrapper(props: Props) {
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
    getEditorMetaData,
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
    showPlaceholderOnEmpty,
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
    getEditorMetaData,
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
    showPlaceholderOnEmpty,
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
}
