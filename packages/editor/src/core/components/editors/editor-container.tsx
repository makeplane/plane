import { FC, ReactNode } from "react";
import { Editor } from "@tiptap/react";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// helpers
import { cn } from "@/helpers/common";
// types
import { TDisplayConfig } from "@/types";

interface EditorContainerProps {
  children: ReactNode;
  displayConfig: TDisplayConfig;
  editor: Editor | null;
  editorContainerClassName: string;
  id: string;
}

export const EditorContainer: FC<EditorContainerProps> = (props) => {
  const { children, displayConfig, editor, editorContainerClassName, id } = props;

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (event.target !== event.currentTarget) return;
    if (!editor) return;
    if (!editor.isEditable) return;
    try {
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
    } catch (error) {
      console.error("An error occurred while handling container click to insert new empty node at bottom:", error);
    }
  };

  const handleContainerMouseLeave = () => {
    const dragHandleElement = document.querySelector("#editor-side-menu");
    if (!dragHandleElement?.classList.contains("side-menu-hidden")) {
      dragHandleElement?.classList.add("side-menu-hidden");
    }
  };

  return (
    <div
      id={`editor-container-${id}`}
      onClick={handleContainerClick}
      onMouseLeave={handleContainerMouseLeave}
      className={cn(
        "editor-container cursor-text relative",
        {
          "active-editor": editor?.isFocused && editor?.isEditable,
        },
        displayConfig.fontSize ?? DEFAULT_DISPLAY_CONFIG.fontSize,
        displayConfig.fontStyle ?? DEFAULT_DISPLAY_CONFIG.fontStyle,
        editorContainerClassName
      )}
    >
      {children}
    </div>
  );
};
