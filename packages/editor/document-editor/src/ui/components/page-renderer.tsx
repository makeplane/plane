import { EditorContainer, EditorContentWrapper } from "@plane/editor-core";
import { Node } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import { Editor, ReactRenderer } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";
import { DocumentDetails } from "src/types/editor-types";
import { LinkView, LinkViewProps } from "./links/link-view";
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

type IPageRenderer = {
  documentDetails: DocumentDetails;
  updatePageTitle: (title: string) => void;
  editor: Editor;
  onActionCompleteHandler: (action: {
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }) => void;
  editorClassNames: string;
  editorContentCustomClassNames?: string;
  hideDragHandle?: () => void;
  readonly: boolean;
};

export const PageRenderer = (props: IPageRenderer) => {
  const {
    documentDetails,
    editor,
    editorClassNames,
    editorContentCustomClassNames,
    updatePageTitle,
    readonly,
    hideDragHandle,
  } = props;

  const [pageTitle, setPagetitle] = useState(documentDetails.title);

  const [linkViewProps, setLinkViewProps] = useState<LinkViewProps>();
  const [isOpen, setIsOpen] = useState(false);
  const [coordinates, setCoordinates] = useState<{ x: number; y: number }>();

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

  const handlePageTitleChange = (title: string) => {
    setPagetitle(title);
    updatePageTitle(title);
  };

  const [cleanup, setcleanup] = useState(() => () => {});

  const floatingElementRef = useRef<HTMLElement | null>(null);

  const closeLinkView = () => {
    setIsOpen(false);
  };

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
            onActionCompleteHandler: props.onActionCompleteHandler,
            closeLinkView: closeLinkView,
            view: "LinkPreview",
            url: href,
            editor: editor,
            from: pos,
            to: pos + node.nodeSize,
          });
        });
      });

      setcleanup(cleanupFunc);
    },
    [editor, cleanup]
  );

  return (
    <div className="w-full pb-64 pl-7 pt-5 page-renderer">
      {!readonly ? (
        <input
          onChange={(e) => handlePageTitleChange(e.target.value)}
          className="-mt-2 w-full break-words border-none bg-custom-background pr-5 text-4xl font-bold outline-none"
          value={pageTitle}
        />
      ) : (
        <input
          onChange={(e) => handlePageTitleChange(e.target.value)}
          className="-mt-2 w-full overflow-x-clip break-words border-none bg-custom-background pr-5 text-4xl font-bold outline-none"
          value={pageTitle}
          disabled
        />
      )}
      <div className="flex relative h-full w-full flex-col pr-5 editor-renderer" onMouseOver={handleLinkHover}>
        <EditorContainer hideDragHandle={hideDragHandle} editor={editor} editorClassNames={editorClassNames}>
          <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
        </EditorContainer>
      </div>
      {isOpen && linkViewProps && coordinates && (
        <div
          style={{ ...floatingStyles, left: `${coordinates.x}px`, top: `${coordinates.y}px` }}
          className={`absolute`}
          ref={refs.setFloating}
        >
          <LinkView {...linkViewProps} style={floatingStyles} {...getFloatingProps()} />
        </div>
      )}
    </div>
  );
};
