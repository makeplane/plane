import { Editor } from "@tiptap/react";
import { ReactNode } from "react";

interface EditorContainerProps {
  editor: Editor | null;
  editorClassNames: string;
  children: ReactNode;
  hideDragHandle?: () => void;
}

export const EditorContainer = ({ editor, editorClassNames, hideDragHandle, children }: EditorContainerProps) => (
  <div
    id="editor-container"
    onClick={() => {
      editor?.chain().focus(undefined, { scrollIntoView: false }).run();
    }}
    onMouseLeave={() => {
      hideDragHandle?.();
    }}
    className={`cursor-text ${editorClassNames}`}
  >
    {children}
  </div>
);
