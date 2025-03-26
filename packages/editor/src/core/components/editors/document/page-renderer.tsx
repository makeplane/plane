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
import { useCallback, useRef, useState, useEffect } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
import { EditorContainer, EditorContentWrapper } from "@/components/editors";
import { LinkView, LinkViewProps } from "@/components/links";
import { AIFeaturesMenu, BlockMenu, EditorBubbleMenu } from "@/components/menus";
// hooks
import { useEditorNavigation } from "@/hooks/use-editor-navigation";
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

  // Use our custom hook for editor navigation
  useEditorNavigation();

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
      <div className="frame-renderer flex-grow w-full" onMouseOver={handleLinkHover}>
        {titleEditor && (
          <div className="relative w-full">
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
                id={id + "-title"}
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
