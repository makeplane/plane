import { EditorContainer, EditorContentWrapper } from "@plane/editor-core";
import { Editor } from "@tiptap/react";
import { useState } from "react";
import { DocumentDetails } from "../types/editor-types";

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
  const {
    documentDetails,
    editor,
    editorClassNames,
    editorContentCustomClassNames,
    updatePageTitle,
    readonly,
  } = props;

  const [pageTitle, setPagetitle] = useState(documentDetails.title);

  const debouncedUpdatePageTitle = debounce(updatePageTitle, 300);

  const handlePageTitleChange = (title: string) => {
    setPagetitle(title);
    debouncedUpdatePageTitle(title);
  };

  return (
    <div className="w-full pl-7 pt-5 pb-64">
      {!readonly ? (
        <input
          onChange={(e) => handlePageTitleChange(e.target.value)}
          className="text-4xl bg-custom-background font-bold break-words pr-5 -mt-2 w-full border-none outline-none"
          value={pageTitle}
        />
      ) : (
        <input
          onChange={(e) => handlePageTitleChange(e.target.value)}
          className="text-4xl bg-custom-background font-bold break-words pr-5 -mt-2 w-full border-none outline-none overflow-x-clip"
          value={pageTitle}
          disabled
        />
      )}
      <div className="flex flex-col h-full w-full pr-5">
        <EditorContainer editor={editor} editorClassNames={editorClassNames}>
          <EditorContentWrapper
            editor={editor}
            editorContentCustomClassNames={editorContentCustomClassNames}
          />
        </EditorContainer>
      </div>
    </div>
  );
};
