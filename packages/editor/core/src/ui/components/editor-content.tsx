import { Editor, EditorContent } from "@tiptap/react";
import { ReactNode } from "react";
import { ImageResizer } from "@/ui/extensions/image/image-resize";
import { TableMenu } from "@/ui/menus/table-menu";

interface EditorContentProps {
  editor: Editor | null;
  editorContentCustomClassNames: string | undefined;
  children?: ReactNode;
}

export const EditorContentWrapper = ({ editor, editorContentCustomClassNames = '', children }: EditorContentProps) => (
  <div className={`${editorContentCustomClassNames}`}>
    <EditorContent editor={editor} />
    <TableMenu editor={editor} />
    {editor?.isActive("image") && <ImageResizer editor={editor} />}
    {children}
  </div>
);
