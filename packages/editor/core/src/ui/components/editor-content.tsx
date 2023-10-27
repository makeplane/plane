import { Editor, EditorContent } from "@tiptap/react";
import { ReactNode } from "react";
import { ImageResizer } from "../extensions/image/image-resize";
import { TableMenu } from "../menus/table-menu";

interface EditorContentProps {
  editor: Editor | null;
  editorContentCustomClassNames: string | undefined;
  children?: ReactNode;
}

export const EditorContentWrapper = ({ editor, editorContentCustomClassNames = '', children }: EditorContentProps) => (
  <div className={`${editorContentCustomClassNames}`}>
    {/* @ts-ignore */}
    <EditorContent editor={editor} />
    {editor?.isEditable && <TableMenu editor={editor} />}
    {(editor?.isActive("image") && editor?.isEditable) && <ImageResizer editor={editor} />}
    {children}
  </div>
);
