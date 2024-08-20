import { Editor, Extension } from "@tiptap/core";
// components
import { EditorContainer } from "@/components/editors";
// hooks
import { getEditorClassNames } from "@/helpers/common";
import { useEditor } from "@/hooks/use-editor";
// types
import { IEditorProps } from "@/types";
import { EditorContentWrapper } from "./editor-content";

type Props = IEditorProps & {
  children?: (editor: Editor) => React.ReactNode;
  extensions: Extension<any, any>[];
  hideDragHandleOnMouseLeave: () => void;
};

export const EditorWrapper: React.FC<Props> = (props) => {
  const {
    children,
    containerClassName,
    editorClassName = "",
    extensions,
    hideDragHandleOnMouseLeave,
    id,
    initialValue,
    fileHandler,
    forwardedRef,
    mentionHandler,
    onChange,
    placeholder,
    tabIndex,
    value,
  } = props;

  const editor = useEditor({
    editorClassName,
    enableHistory: true,
    extensions,
    fileHandler,
    forwardedRef,
    id,
    initialValue,
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
      editor={editor}
      editorContainerClassName={editorContainerClassName}
      id={id}
      hideDragHandle={hideDragHandleOnMouseLeave}
    >
      {children?.(editor)}
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
      </div>
    </EditorContainer>
  );
};
