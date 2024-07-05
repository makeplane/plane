import { FC, ReactNode } from "react";
import { Editor, EditorContent } from "@tiptap/react";
// extensions
import { ImageResizer } from "@/extensions/image";

interface EditorContentProps {
  editor: Editor | null;
  children?: ReactNode;
  tabIndex?: number;
}

export const EditorContentWrapper: FC<EditorContentProps> = (props) => {
  const { editor, tabIndex, children } = props;

  return (
    <div tabIndex={tabIndex} onFocus={() => editor?.chain().focus(undefined, { scrollIntoView: false }).run()}>
      <EditorContent editor={editor} />
      {editor?.isActive("image") && editor?.isEditable && <ImageResizer editor={editor} />}
      {children}
    </div>
  );
};
