import { Editor } from "@tiptap/react";
import { FC, ReactNode } from "react";
import { cn } from "src/lib/utils";

interface EditorContainerProps {
  editor: Editor | null;
  editorClassNames: string;
  children: ReactNode;
  hideDragHandle?: () => void;
}

export const EditorContainer: FC<EditorContainerProps> = (props) => {
  const { editor, editorClassNames, hideDragHandle, children } = props;

  const handleContainerClick = () => {
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
  };

  return (
    <div
      id="editor-container"
      onClick={handleContainerClick}
      onMouseLeave={() => {
        hideDragHandle?.();
      }}
      className={cn(`cursor-text`, { "active-editor": editor?.isFocused && editor?.isEditable }, editorClassNames)}
    >
      {children}
    </div>
  );
};
