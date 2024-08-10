import { Editor, Extension } from "@tiptap/core";
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
  extensions: Extension<any, any>[];
};

export const EditorWrapper: React.FC<Props> = (props) => {
  const {
    children,
    containerClassName,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    extensions,
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
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
      id={id}
    >
      {children?.(editor)}
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
      </div>
    </EditorContainer>
  );
};
