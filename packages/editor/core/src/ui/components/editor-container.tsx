import { Editor } from "@tiptap/react";
import { ReactNode } from "react";
import { findParentNodeOfType } from "../extensions/table/table/utilities/insert-line-below-table-action";

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
      if (editor.isFocused) return; // if editor is already focused, do nothing

      const { selection } = editor.state;
      const currentNode = selection.$from.node();

      editor?.chain().focus("end", { scrollIntoView: false }).run(); // Focus the editor at the end

      if (currentNode.content.size <= 0) return; // if the current node is empty, do nothing

      // Insert a new paragraph at the end of the document
      const endPosition = editor?.state.doc.content.size;
      editor?.chain().insertContentAt(endPosition, { type: "paragraph" }).run();

      // Optionally, focus the newly added paragraph for immediate editing
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

function handleNodeInsertionIfLastNodeTable(editor: Editor) {
  const { selection } = editor.state;
  const tableNodeResult = findParentNodeOfType(selection, "table");
  if (!tableNodeResult) return;

  const { node: tableNode, pos: tablePos } = tableNodeResult;
  const nextNodePos = tablePos + tableNode.nodeSize;
  const nextNode = editor.state.doc.nodeAt(nextNodePos);

  if (nextNode && nextNode.type.name === "paragraph") {
    editor.commands.setTextSelection(nextNodePos + 1);
  } else if (!nextNode) {
    editor.commands.insertContentAt(nextNodePos, { type: "paragraph" });
  }
}
