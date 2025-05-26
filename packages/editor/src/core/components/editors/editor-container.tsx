import { Editor } from "@tiptap/react";
import { FC, ReactNode, useRef } from "react";
// plane utils
import { cn } from "@plane/utils";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// types
import { TDisplayConfig } from "@/types";
// components
import { LinkViewContainer } from "./link-view-container";

interface EditorContainerProps {
  children: ReactNode;
  displayConfig: TDisplayConfig;
  editor: Editor;
  editorContainerClassName: string;
  id: string;
}

export const EditorContainer: FC<EditorContainerProps> = (props) => {
  const { children, displayConfig, editor, editorContainerClassName, id } = props;
  const containerRef = useRef<HTMLDivElement>(null);

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

      // Get the last node in the document
      const docSize = editor.state.doc.content.size;
      const lastNodePos = editor.state.doc.resolve(Math.max(0, docSize - 2));
      const lastNode = lastNodePos.node();

      // Check if its last node and add new node
      if (lastNode) {
        const isLastNodeEmptyParagraph = lastNode.type.name === "paragraph" && lastNode.content.size === 0;

        // Only insert a new paragraph if the last node is not an empty paragraph and not a doc node
        if (!isLastNodeEmptyParagraph && lastNode.type.name !== "doc") {
          console.log("insert empty node ");
          const endPosition = editor?.state.doc.content.size;
          editor?.chain().insertContentAt(endPosition, { type: "paragraph" }).run();

          // Focus the newly added paragraph for immediate editing
          editor
            .chain()
            .setTextSelection(endPosition + 1)
            .run();
        }
      }
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
    <>
      <div
        ref={containerRef}
        id={`editor-container-${id}`}
        onClick={handleContainerClick}
        onMouseLeave={handleContainerMouseLeave}
        className={cn(
          `editor-container cursor-text relative line-spacing-${displayConfig.lineSpacing ?? DEFAULT_DISPLAY_CONFIG.lineSpacing}`,
          {
            "active-editor": editor?.isFocused && editor?.isEditable,
            "wide-layout": displayConfig.wideLayout,
          },
          displayConfig.fontSize ?? DEFAULT_DISPLAY_CONFIG.fontSize,
          displayConfig.fontStyle ?? DEFAULT_DISPLAY_CONFIG.fontStyle,
          editorContainerClassName
        )}
      >
        {children}
        <LinkViewContainer editor={editor} containerRef={containerRef} />
      </div>
    </>
  );
};
