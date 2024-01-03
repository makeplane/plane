import { EditorContainer, EditorContentWrapper } from "@plane/editor-core";
import { Node } from "@tiptap/pm/model";
import { EditorView } from "@tiptap/pm/view";
import { Editor, ReactRenderer } from "@tiptap/react";
import { useCallback, useState } from "react";
import { DocumentDetails } from "src/types/editor-types";
import tippy from "tippy.js";
import { LinkPreview } from "./link-preview";

type IPageRenderer = {
  documentDetails: DocumentDetails;
  updatePageTitle: (title: string) => Promise<void>;
  editor: Editor;
  editorClassNames: string;
  editorContentCustomClassNames?: string;
  readonly: boolean;
};

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: any[]) {
    const later = () => {
      if (timeout) clearTimeout(timeout);
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const PageRenderer = (props: IPageRenderer) => {
  const { documentDetails, editor, editorClassNames, editorContentCustomClassNames, updatePageTitle, readonly } = props;

  const [pageTitle, setPagetitle] = useState(documentDetails.title);

  const debouncedUpdatePageTitle = debounce(updatePageTitle, 300);

  const handlePageTitleChange = (title: string) => {
    setPagetitle(title);
    debouncedUpdatePageTitle(title);
  };

  const handleLinkHover = useCallback(
    (event: React.MouseEvent) => {
      if (!editor) return;
      const target = event.target as HTMLElement;
      const view = editor.view as EditorView;

      if (!target || !view) return;
      const pos = view.posAtDOM(target, 0);
      if (!pos || pos < 0) return;

      const node = view.state.doc.nodeAt(pos) as Node;
      if (!node || !node.isAtom) return;

      // we need to check if any of the marks are links
      const marks = node.marks;

      if (!marks) return;

      const linkMark = marks.find((mark) => mark.type.name === "link");

      if (!linkMark) return;

      const href = linkMark.attrs.href;
      const component = new ReactRenderer(LinkPreview, {
        props: {
          url: href,
          editor: editor,
          from: pos,
          to: pos + node.nodeSize,
        },
        editor,
      });

      tippy(target, {
        content: component.element,
        interactive: true,
        appendTo: () => document.querySelector("#editor-container") as HTMLElement,
        arrow: true,
        animation: "fade",
        placement: "bottom-start",
      });
    },
    [editor]
  );

  return (
    <div className="w-full pb-64 pl-7 pt-5">
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
      <div className="flex h-full w-full flex-col pr-5" onMouseOver={handleLinkHover}>
        <EditorContainer editor={editor} editorClassNames={editorClassNames}>
          <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
        </EditorContainer>
      </div>
    </div>
  );
};
