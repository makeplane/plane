import { autoUpdate, flip, hide, shift, useDismiss, useFloating, useInteractions } from "@floating-ui/react";
import { Node } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import { Editor, useEditorState } from "@tiptap/react";
import { FC, ReactNode, useCallback, useEffect, useState } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
import { LinkView, LinkViewProps } from "@/components/links";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
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
  // states for link hover functionality
  const [linkViewProps, setLinkViewProps] = useState<LinkViewProps>();
  const [isOpen, setIsOpen] = useState(false);
  const [virtualElement, setVirtualElement] = useState<HTMLElement | null>(null);

  const editorState = useEditorState({
    editor,
    selector: ({ editor }: { editor: Editor }) => ({
      openLink: editor.storage.image?.openLink,
      linkPosition: editor.storage.image?.linkPosition,
    }),
  });

  useEffect(() => {
    if (editorState.openLink) {
      setIsOpen(true);
      if (editorState.linkPosition) {
        const element = editor?.view.domAtPos(editorState.linkPosition)?.node as HTMLElement;
        setVirtualElement(element);
      }
      setLinkViewProps({
        url: "",
        view: "LinkEditView",
        editor: editor,
        from: editorState.linkPosition.from,
        to: editorState.linkPosition.to,
        closeLinkView: () => {
          setIsOpen(false);
          if (editor) editor.storage.image.openLink = false;
        },
      });
    } else {
      setIsOpen(false);
    }
  }, [editorState.openLink, editorState.linkPosition, editor]);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: {
      reference: virtualElement,
    },
    middleware: [
      flip({
        fallbackPlacements: ["top", "bottom"],
      }),
      shift({
        padding: 5,
      }),
      hide(),
    ],
    whileElementsMounted: autoUpdate,
    placement: "bottom-start",
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const handleLinkHover = useCallback(
    (event: React.MouseEvent) => {
      if (!editor || editorState.openLink) return; // Don't handle hover if link edit is open
      const target = event.target as HTMLElement;
      const view = editor.view as EditorView;

      if (!target || !view) return;
      const pos = view.posAtDOM(target, 0);
      if (!pos || pos < 0) return;

      if (target.nodeName !== "A") return;

      const node = view.state.doc.nodeAt(pos) as Node;
      if (!node || !node.isAtom) return;

      const marks = node.marks;
      if (!marks) return;

      const linkMark = marks.find((mark) => mark.type.name === "link");
      if (!linkMark) return;

      setVirtualElement(target);

      setLinkViewProps({
        view: "LinkPreview",
        url: linkMark.attrs.href,
        editor: editor,
        from: pos,
        to: pos + node.nodeSize,
        closeLinkView: () => {
          setIsOpen(false);
          editor.storage.image.openLink = false;
        },
      });

      setIsOpen(true);
    },
    [editor, editorState.openLink]
  );

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
    <>
      <div
        id={`editor-container-${id}`}
        onClick={handleContainerClick}
        onMouseLeave={handleContainerMouseLeave}
        onMouseOver={handleLinkHover}
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
      {isOpen && linkViewProps && virtualElement && (
        <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
          <LinkView {...linkViewProps} style={floatingStyles} />
        </div>
      )}
    </>
  );
};
