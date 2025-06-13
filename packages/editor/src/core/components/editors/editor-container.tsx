import { Editor } from "@tiptap/react";
import { FC, ReactNode, useRef } from "react";
// plane utils
import { cn } from "@plane/utils";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
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
  isMobile: boolean;
}

export const EditorContainer: FC<EditorContainerProps> = (props) => {
  const { children, displayConfig, editor, editorContainerClassName, id, isMobile } = props;
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
          editor.isActive(CORE_EXTENSIONS.ORDERED_LIST) ||
          editor.isActive(CORE_EXTENSIONS.BULLET_LIST) ||
          editor.isActive(CORE_EXTENSIONS.TASK_ITEM) ||
          editor.isActive(CORE_EXTENSIONS.TABLE) ||
          editor.isActive(CORE_EXTENSIONS.BLOCKQUOTE) ||
          editor.isActive(CORE_EXTENSIONS.CODE_BLOCK)
        ) // Check if it's an empty node within an orderedList, bulletList, taskItem, table, quote or code block
      ) {
        return;
      }

      // Get the last node in the document
      const docSize = editor.state.doc.content.size;
      const lastNodePos = editor.state.doc.resolve(Math.max(0, docSize - 2));
      const lastNode = lastNodePos.node();

      // Check if the last node is a  not paragraph
      if (lastNode && lastNode.type.name !== CORE_EXTENSIONS.PARAGRAPH) {
        // If last node is not a paragraph, insert a new paragraph at the end
        const endPosition = editor?.state.doc.content.size;
        editor?.chain().insertContentAt(endPosition, { type: CORE_EXTENSIONS.PARAGRAPH }).run();

        // Focus the newly added paragraph for immediate editing
        editor
          .chain()
          .setTextSelection(endPosition + 1)
          .run();
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
        {!isMobile && <LinkViewContainer editor={editor} containerRef={containerRef} />}
      </div>
    </>
  );
};
