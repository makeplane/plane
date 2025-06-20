import { autoUpdate, flip, hide, shift, useDismiss, useFloating, useInteractions } from "@floating-ui/react";
import { Editor, useEditorState } from "@tiptap/react";
import { FC, useCallback, useEffect, useState } from "react";
// components
import { LinkView, LinkViewProps } from "@/components/links";

interface LinkViewContainerProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const LinkViewContainer: FC<LinkViewContainerProps> = ({ editor, containerRef }) => {
  const [linkViewProps, setLinkViewProps] = useState<LinkViewProps>();
  const [isOpen, setIsOpen] = useState(false);
  const [virtualElement, setVirtualElement] = useState<Element | null>(null);

  const editorState = useEditorState({
    editor,
    selector: ({ editor }: { editor: Editor }) => ({
      linkExtensionStorage: editor.storage.link,
    }),
  });

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

  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  const handleLinkHover = useCallback(
    (event: MouseEvent) => {
      if (!editor || editorState.linkExtensionStorage.isBubbleMenuOpen) return;

      // Find the closest anchor tag from the event target
      const target = (event.target as HTMLElement)?.closest("a");
      if (!target) return;

      const referenceProps = getReferenceProps();
      Object.entries(referenceProps).forEach(([key, value]) => {
        target.setAttribute(key, value as string);
      });

      const view = editor.view;
      if (!view) return;

      try {
        const pos = view.posAtDOM(target, 0);
        if (pos === undefined || pos < 0) return;

        const node = view.state.doc.nodeAt(pos);
        if (!node) return;

        const linkMark = node.marks?.find((mark) => mark.type.name === "link");
        if (!linkMark) return;

        setVirtualElement(target);

        // Only update if not already open or if hovering over a different link
        if (!isOpen || (linkViewProps && (linkViewProps.from !== pos || linkViewProps.to !== pos + node.nodeSize))) {
          setLinkViewProps({
            view: "LinkPreview", // Always start with preview for new links
            url: linkMark.attrs.href,
            text: node.text || "",
            editor: editor,
            from: pos,
            to: pos + node.nodeSize,
            closeLinkView: () => {
              setIsOpen(false);
              editorState.linkExtensionStorage.isPreviewOpen = false;
            },
          });
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error handling link hover:", error);
      }
    },
    [editor, editorState.linkExtensionStorage, getReferenceProps, isOpen, linkViewProps]
  );

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mouseover", handleLinkHover);

    return () => {
      container.removeEventListener("mouseover", handleLinkHover);
    };
  }, [handleLinkHover]);

  // Close link view when bubble menu opens
  useEffect(() => {
    if (editorState.linkExtensionStorage.isBubbleMenuOpen && isOpen) {
      setIsOpen(false);
    }
  }, [editorState.linkExtensionStorage, isOpen]);

  return (
    <>
      {isOpen && linkViewProps && virtualElement && (
        <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 100 }} {...getFloatingProps()}>
          <LinkView {...linkViewProps} style={floatingStyles} />
        </div>
      )}
    </>
  );
};
