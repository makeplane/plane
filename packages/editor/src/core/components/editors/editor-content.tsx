import { type Editor, EditorContent } from "@tiptap/react";
import { FC, ReactNode } from "react";

type Props = {
  className?: string;
  children?: ReactNode;
  editor: Editor | null;
  id: string;
  tabIndex?: number;
};

export const EditorContentWrapper: FC<Props> = (props) => {
  const { editor, className, children, tabIndex, id } = props;

  return (
    <div
      tabIndex={tabIndex}
      onFocus={() => editor?.chain().focus(undefined, { scrollIntoView: false }).run()}
      className={className}
    >
      <EditorContent editor={editor} id={id} />
      {children}
    </div>
  );
};
