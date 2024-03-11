import { Editor, EditorContent } from "@tiptap/react";
import { ReactNode } from "react";
import { ImageResizer } from "src/ui/extensions/image/image-resize";

interface EditorContentProps {
  editor: Editor | null;
  editorContentCustomClassNames: string | undefined;
  children?: ReactNode;
}

export const EditorContentWrapper = ({ editor, editorContentCustomClassNames = "", children }: EditorContentProps) => (
  <div className={`contentEditor ${editorContentCustomClassNames}`}>
    <EditorContent editor={editor} />
    {editor?.isActive("image") && editor?.isEditable && <ImageResizer editor={editor} />}
    {children}
  </div>
);
