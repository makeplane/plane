import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Editor } from "@tiptap/react";
import type { FC, ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
// plane utils
import { cn } from "@plane/utils";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
import { CORE_EXTENSIONS } from "@/constants/extension";
// components
import type { TCollabValue } from "@/contexts";
import { LinkContainer } from "@/plane-editor/components/link-container";
// plugins
import { nodeHighlightPluginKey } from "@/plugins/highlight";
// types
import type { TDisplayConfig } from "@/types";

type Props = {
  children: ReactNode;
  displayConfig: TDisplayConfig;
  editor: Editor;
  editorContainerClassName: string;
  id: string;
  isTouchDevice: boolean;
  provider?: HocuspocusProvider | undefined;
  state?: TCollabValue["state"];
};

export function EditorContainer(props: Props) {
  const { children, displayConfig, editor, editorContainerClassName, id, isTouchDevice, provider, state } = props;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolledOnce = useRef(false);
  const scrollToNode = useCallback(
    (nodeId: string) => {
      if (!editor) return false;

      const doc = editor.state.doc;
      let pos: number | null = null;

      doc.descendants((node, position) => {
        if (node.attrs && node.attrs.id === nodeId) {
          pos = position;
          return false;
        }
      });

      if (pos === null) {
        return false;
      }

      const nodePosition = pos;
      const tr = editor.state.tr.setMeta(nodeHighlightPluginKey, { nodeId });
      editor.view.dispatch(tr);

      requestAnimationFrame(() => {
        const domNode = editor.view.nodeDOM(nodePosition);
        if (domNode instanceof HTMLElement) {
          domNode.scrollIntoView({ behavior: "instant", block: "center" });
        }
      });

      editor.once("focus", () => {
        const clearTr = editor.state.tr.setMeta(nodeHighlightPluginKey, { nodeId: null });
        editor.view.dispatch(clearTr);
      });

      hasScrolledOnce.current = true;
      return true;
    },

    [editor]
  );

  useEffect(() => {
    const nodeId = window.location.href.split("#")[1];

    const handleSynced = () => scrollToNode(nodeId);

    if (nodeId && !hasScrolledOnce.current) {
      if (provider && state) {
        const { hasCachedContent } = state;
        // If the provider is synced or the cached content is available and the server is disconnected, scroll to the node
        if (hasCachedContent) {
          const hasScrolled = handleSynced();
          if (!hasScrolled) {
            provider.on("synced", handleSynced);
          }
        } else if (provider.isSynced) {
          handleSynced();
        } else {
          provider.on("synced", handleSynced);
        }
      } else {
        handleSynced();
      }
      return () => {
        if (provider) {
          provider.off("synced", handleSynced);
        }
      };
    }
  }, [scrollToNode, provider, state]);

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

      // Get the last child node in the document
      const doc = editor.state.doc;
      const lastNode = doc.lastChild;

      // Check if its last node and add new node
      if (lastNode) {
        const isLastNodeParagraph = lastNode.type.name === CORE_EXTENSIONS.PARAGRAPH;
        // Insert a new paragraph if the last node is not a paragraph and not a doc node
        if (!isLastNodeParagraph && lastNode.type.name !== CORE_EXTENSIONS.DOCUMENT) {
          // Only insert a new paragraph if the last node is not an empty paragraph and not a doc node
          const endPosition = editor?.state.doc.content.size;
          editor?.chain().insertContentAt(endPosition, { type: "paragraph" }).focus("end").run();
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
          },
          displayConfig.fontSize ?? DEFAULT_DISPLAY_CONFIG.fontSize,
          displayConfig.fontStyle ?? DEFAULT_DISPLAY_CONFIG.fontStyle,
          editorContainerClassName
        )}
      >
        {children}
        {!isTouchDevice && <LinkContainer editor={editor} containerRef={containerRef} />}
      </div>
    </>
  );
}
