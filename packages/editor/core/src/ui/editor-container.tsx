import { Editor } from "@tiptap/react";
import { ReactNode } from "react";

interface EditorContainerProps {
  editor: Editor | null;
  editorClassNames: string;
  children: ReactNode;
}

export const EditorContainer = ({ editor, editorClassNames, children }: EditorContainerProps) => (
  <div
    id="tiptap-container"
    onClick={() => {
      editor?.chain().focus().run();
    }}
    className={`tiptap-editor-container cursor-text ${editorClassNames}`}
  >
    {children}
  </div>
);
