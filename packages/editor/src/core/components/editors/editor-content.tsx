import { Editor, EditorContent } from "@tiptap/react";
import { FC, ReactNode } from "react";

interface EditorContentProps {
  children?: ReactNode;
  editor: Editor | null;
  id: string;
  tabIndex?: number;
  focus?: boolean;
  className?: string;
}

export const EditorContentWrapper: FC<EditorContentProps> = (props) => {
  const { editor, children, tabIndex, className, focus } = props;

  return (
    <div
      tabIndex={tabIndex}
      onFocus={() => {
        if (!focus) return;
        editor?.chain().focus(undefined, { scrollIntoView: false }).run();
      }}
      className={className}
    >
      <EditorContent editor={editor} />
      {children}
    </div>
  );
};
