import { type Editor, EditorContent } from "@tiptap/react";
import { FC, ReactNode } from "react";

type Props = {
  children?: ReactNode;
  editor: Editor | null;
  id: string;
  tabIndex?: number;
};

export const EditorContentWrapper: FC<Props> = (props) => {
  const { editor, children, tabIndex, id } = props;

  return (
    <div tabIndex={tabIndex} onFocus={() => editor?.chain().focus(undefined, { scrollIntoView: false }).run()}>
      <EditorContent editor={editor} id={id} />
      {children}
    </div>
  );
};
