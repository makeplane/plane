import { Editor, EditorContent } from "@tiptap/react";
import { FC, ReactNode } from "react";

interface EditorContentProps {
  children?: ReactNode;
  editor: Editor | null;
  id: string;
  onClick?: () => void;
  tabIndex?: number;
}

export const EditorContentWrapper: FC<EditorContentProps> = (props) => {
  const { editor, children, id, onClick, tabIndex } = props;

  return (
    <div
      tabIndex={tabIndex}
      onClick={onClick}
      onFocus={() => editor?.chain().focus(undefined, { scrollIntoView: false }).run()}
      className="editor-content"
    >
      <EditorContent editor={editor} />
      {children}
    </div>
  );
};
