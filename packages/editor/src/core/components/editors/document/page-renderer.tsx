import {
  autoUpdate,
  computePosition,
  flip,
  hide,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import { Node } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import { Editor, ReactRenderer } from "@tiptap/react";
// react
import { useCallback, useRef, useEffect, useState } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
import { LinkView, LinkViewProps } from "@/components/links";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// types
import { TAIHandler, TDisplayConfig } from "@/types";

type IPageRenderer = {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled: boolean;
  displayConfig: TDisplayConfig;
  editor: Editor;
  titleEditor?: Editor;
  editorContainerClassName: string;
  id: string;
  tabIndex?: number;
};

export const PageRenderer = (props: IPageRenderer) => {
  const { aiHandler, bubbleMenuEnabled, displayConfig, editor, titleEditor, editorContainerClassName, id, tabIndex } =
    props;
  // states
  const [linkViewProps, setLinkViewProps] = useState<LinkViewProps>();
  const [isOpen, setIsOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }>();
  const [cleanup, setCleanup] = useState(() => () => {});
  const initialFocusApplied = useRef(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [flip(), shift(), hide({ strategy: "referenceHidden" })],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context, {
    ancestorScroll: true,
  });

  const { getFloatingProps } = useInteractions([dismiss]);

  // Set initial focus based on whether title editor is empty
  useEffect(() => {
    if (!titleEditor || !editor || initialFocusApplied.current) return;

    // Wait for editors to be fully initialized
    setTimeout(() => {
      if (titleEditor.isEmpty) {
        // If title is empty, focus on title editor
        titleEditor.commands.focus("start");
      } else {
        // If title has content, focus on main editor
        editor.commands.focus("start");
      }
      initialFocusApplied.current = true;
    }, 100);
  }, [titleEditor, editor]);

  // Setup keyboard event handlers for editor navigation
  useEffect(() => {
    if (!titleEditor || !editor) return;

    // Add keyboard event listeners directly to the DOM elements
    const titleDOMElement = titleEditor.view.dom;
    const mainDOMElement = editor.view.dom;

    const titleKeydownHandler = (event: KeyboardEvent) => {
      // Handle Enter key at the end of title editor
      if (event.key === "Enter") {
        const { state } = titleEditor;
        const { selection } = state;
        const lastPosition = state.doc.content.size - 1;

        // Check if cursor is at the end of the title editor
        if (selection.anchor === lastPosition && selection.head === lastPosition) {
          // Prevent default Enter behavior
          event.preventDefault();

          // Focus the main editor
          setTimeout(() => {
            editor.commands.focus("start");
          }, 0);
        }
      }

      // Handle Tab key in title editor
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        setTimeout(() => {
          editor.commands.focus("start");
        }, 0);
      }

      // Handle Down Arrow key in title editor - always move to main editor
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setTimeout(() => {
          editor.commands.focus("start");
        }, 0);
      }
    };

    const mainKeydownHandler = (event: KeyboardEvent) => {
      // Handle Shift+Tab in main editor
      if (event.key === "Tab" && event.shiftKey) {
        const { state } = editor;
        const { selection } = state;

        // Check if cursor is at the beginning of the document
        if (selection.anchor <= 2 && selection.head <= 2) {
          event.preventDefault();
          setTimeout(() => {
            titleEditor.commands.focus("end");
          }, 0);
        }
      }

      // Handle Backspace in main editor
      if (event.key === "Backspace") {
        const { state } = editor;
        const { selection } = state;

        // Check if cursor is at the beginning of the document
        if (selection.empty && selection.anchor <= 1) {
          event.preventDefault();
          setTimeout(() => {
            titleEditor.commands.focus("end");
          }, 0);
        }
      }

      // Handle Up Arrow key in main editor
      if (event.key === "ArrowUp") {
        const { state } = editor;
        const { selection } = state;

        // Check if cursor is in the first line
        // We need to check if we're in the first paragraph/block
        const resolvedPos = state.doc.resolve(selection.anchor);
        const isFirstBlock =
          resolvedPos.parent.type.name === "paragraph" && resolvedPos.depth === 1 && resolvedPos.index(0) === 0;

        // Also check if we're near the start of the first block
        const isNearStart = selection.anchor <= 5; // Allow a few characters of buffer

        if (isFirstBlock && isNearStart) {
          event.preventDefault();
          setTimeout(() => {
            titleEditor.commands.focus("end");
          }, 0);
        }
      }
    };

    titleDOMElement.addEventListener("keydown", titleKeydownHandler);
    mainDOMElement.addEventListener("keydown", mainKeydownHandler);

    // Cleanup event handlers on unmount
    return () => {
      titleDOMElement.removeEventListener("keydown", titleKeydownHandler);
      mainDOMElement.removeEventListener("keydown", mainKeydownHandler);
    };
  }, [titleEditor, editor]);
  const floatingElementRef = useRef<HTMLElement | null>(null);

  const closeLinkView = () => setIsOpen(false);

  const handleLinkHover = useCallback(
    (event: React.MouseEvent) => {
      if (!editor) return;
      const target = event.target as HTMLElement;
      const view = editor.view as EditorView;

      if (!target || !view) return;
      const pos = view.posAtDOM(target, 0);
      if (!pos || pos < 0) return;

      if (target.nodeName !== "A") return;

      const node = view.state.doc.nodeAt(pos) as Node;
      if (!node || !node.isAtom) return;

      // we need to check if any of the marks are links
      const marks = node.marks;

      if (!marks) return;

      const linkMark = marks.find((mark) => mark.type.name === "link");

      if (!linkMark) return;

      if (floatingElementRef.current) {
        floatingElementRef.current?.remove();
      }

      if (cleanup) cleanup();

      const href = linkMark.attrs.href;
      const componentLink = new ReactRenderer(LinkView, {
        props: {
          view: "LinkPreview",
          url: href,
          editor: editor,
          from: pos,
          to: pos + node.nodeSize,
        },
        editor,
      });

      const referenceElement = target as HTMLElement;
      const floatingElement = componentLink.element as HTMLElement;

      floatingElementRef.current = floatingElement;

      const cleanupFunc = autoUpdate(referenceElement, floatingElement, () => {
        computePosition(referenceElement, floatingElement, {
          placement: "bottom",
          middleware: [
            flip(),
            shift(),
            hide({
              strategy: "referenceHidden",
            }),
          ],
        }).then(({ x, y }) => {
          setCoordinates({ x: x - 300, y: y - 50 });
          setIsOpen(true);
          setLinkViewProps({
            closeLinkView: closeLinkView,
            view: "LinkPreview",
            url: href,
            editor: editor,
            from: pos,
            to: pos + node.nodeSize,
          });
        });
      });

      setCleanup(cleanupFunc);
    },
    [editor, cleanup]
  );

  return (
    <>
      <div className="frame-renderer flex-grow w-full -mx-5" onMouseOver={handleLinkHover}>
        {titleEditor && (
          <div className="relative w-full flex-shrink-0 md:pl-5 px-4">
            <EditorContainer
              editor={titleEditor}
              id={id + "-title"}
              editorContainerClassName={cn("page-title-editor bg-transparent p-0 pb-5 border-none ml-5", {
                "small-font": displayConfig.fontSize === "small-font",
                "large-font": displayConfig.fontSize === "large-font",
              })}
              displayConfig={displayConfig}
            >
              <EditorContentWrapper
                focus={false}
                editor={titleEditor}
                id={id}
                tabIndex={tabIndex}
                className="no-scrollbar placeholder-custom-text-400 border-[0.5px] border-custom-border-200 bg-transparent tracking-[-2%] font-bold text-[2rem] leading-[2.375rem] w-full outline-none p-0 border-none resize-none rounded-none"
              />
            </EditorContainer>
          </div>
        )}
        <EditorContainer
          displayConfig={displayConfig}
          editor={editor}
          editorContainerClassName={editorContainerClassName}
          id={id}
        >
          <EditorContentWrapper editor={editor} id={id} tabIndex={tabIndex} />
          {editor.isEditable && (
            <div>
              {bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}
              <BlockMenu editor={editor} />
              <AIFeaturesMenu menu={aiHandler?.menu} />
            </div>
          )}
        </EditorContainer>
      </div>
      {isOpen && linkViewProps && coordinates && (
        <div
          style={{ ...floatingStyles, left: `${coordinates.x}px`, top: `${coordinates.y}px` }}
          className="absolute"
          ref={refs.setFloating}
        >
          <LinkView {...linkViewProps} style={floatingStyles} {...getFloatingProps()} />
        </div>
      )}
    </>
  );
};
