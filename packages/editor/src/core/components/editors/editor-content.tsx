import { type Editor, EditorContent } from "@tiptap/react";

type Props = {
  children?: React.ReactNode;
  editor: Editor | null;
  id: string;
  tabIndex?: number;
};

export const EditorContentWrapper: React.FC<Props> = (props) => {
  const { editor, children, tabIndex, id } = props;

  return (
    <div tabIndex={tabIndex} onFocus={() => editor?.chain().focus(undefined, { scrollIntoView: false }).run()}>
      <EditorContent editor={editor} id={id} />
      {children}
    </div>
  );
};
