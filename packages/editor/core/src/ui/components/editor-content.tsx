import { Editor, EditorContent } from "@tiptap/react";
import { FC, ReactNode } from "react";
import { ImageResizer } from "src/ui/extensions/image/image-resize";

interface EditorContentProps {
  editor: Editor | null;
  editorContentCustomClassNames: string | undefined;
  children?: ReactNode;
  tabIndex?: number;
}

export const EditorContentWrapper: FC<EditorContentProps> = (props) => {
  const { editor, editorContentCustomClassNames = "", tabIndex, children } = props;

  return (
    <div
      className={`contentEditor ${editorContentCustomClassNames}`}
      tabIndex={tabIndex}
      onFocus={() => {
        editor?.chain().focus(undefined, { scrollIntoView: false }).run();
      }}
    >
      <EditorContent editor={editor} />
      {editor?.isActive("image") && editor?.isEditable && <ImageResizer editor={editor} />}
      {children}
    </div>
  );
};
