import { FC, ReactNode } from "react";
import { Editor, EditorContent } from "@tiptap/react";

interface EditorContentProps {
  children?: ReactNode;
  editor: Editor | null;
  id: string;
  tabIndex?: number;
}

export const EditorContentWrapper: FC<EditorContentProps> = (props) => {
  const { editor, children, id, tabIndex } = props;

  return (
    <div tabIndex={tabIndex} onFocus={() => editor?.chain().focus(undefined, { scrollIntoView: false }).run()}>
      <EditorContent editor={editor} />
      {children}
    </div>
  );
};
