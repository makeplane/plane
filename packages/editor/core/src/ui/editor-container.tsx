import { Editor } from "@tiptap/react";
import { ReactNode } from "react";

interface EditorContainerProps {
  editor: Editor | null;
  editorClassNames: string;
  children: ReactNode;
}

export const EditorContainer = ({ editor, editorClassNames, children }: EditorContainerProps) => (
  <div
    id="editor-container"
    onClick={() => {
      editor?.chain().focus().run();
    }}
    className={`cursor-text ${editorClassNames}`}
  >
    {children}
  </div>
);
