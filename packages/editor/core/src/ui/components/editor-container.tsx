import { Editor } from "@tiptap/react";
import { ReactNode } from "react";

interface EditorContainerProps {
  editor: Editor | null;
  editorClassNames: string;
  children: ReactNode;
  hideDragHandle?: () => void;
}

export const EditorContainer = ({ editor, editorClassNames, hideDragHandle, children }: EditorContainerProps) => (
  <div
    id="editor-container"
    onClick={() => {
      if (!editor) return;
      if (!editor.isEditable) return;
      if (editor.isFocused) return; // If editor is already focused, do nothing

      const { selection } = editor.state;
      const currentNode = selection.$from.node();

      editor?.chain().focus("end", { scrollIntoView: false }).run(); // Focus the editor at the end

      if (
        currentNode.content.size === 0 && // Check if the current node is empty
        !(
          editor.isActive("orderedList") ||
          editor.isActive("bulletList") ||
          editor.isActive("taskItem") ||
          editor.isActive("table") ||
          editor.isActive("blockquote") ||
          editor.isActive("codeBlock")
        ) // Check if it's an empty node within an orderedList, bulletList, taskItem, table, quote or code block
      ) {
        return;
      }

      // Insert a new paragraph at the end of the document
      const endPosition = editor?.state.doc.content.size;
      editor?.chain().insertContentAt(endPosition, { type: "paragraph" }).run();

      // Focus the newly added paragraph for immediate editing
      editor
        .chain()
        .setTextSelection(endPosition + 1)
        .run();
    }}
    onMouseLeave={() => {
      hideDragHandle?.();
    }}
    className={`cursor-text ${editorClassNames}`}
  >
    {children}
  </div>
);
