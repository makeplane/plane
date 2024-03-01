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
      if (!editor?.isFocused) {
        editor?.chain().focus("end", { scrollIntoView: false }).run();
        if (editor?.state) {
          const { selection } = editor.state;
          const currentNode = selection.$from.node();
          if ((currentNode && currentNode.content.size > 0) || editor.isActive("table")) {
            if (editor.isActive("listItem")) {
              console.log("hit list case");
              editor.commands.enter();
              editor.commands.liftListItem("listItem");
            } else if (editor.isActive("taskItem")) {
              editor.commands.enter();
              editor.commands.liftListItem("taskItem");
            } else if (editor.isActive("table")) {
              handleNodeInsertionIfLastNodeTable(editor);
            } else if (editor.isActive("codeBlock")) {
              editor.commands.exitCode();
            } else if (editor.isActive("image")) {
              editor.commands.createParagraphNear();
            } else {
              console.log("hit end case");
              editor.commands.enter();
            }
          }
        }
      }
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
