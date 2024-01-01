import { EditorContainer, EditorContentWrapper } from "@plane/editor-core";
import { Editor } from "@tiptap/react";
import { useState } from "react";
import { DocumentDetails } from "src/types/editor-types";

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
      <div className="flex h-full w-full flex-col pr-5">
        <EditorContainer editor={editor} editorClassNames={editorClassNames}>
          <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
        </EditorContainer>
      </div>
    </div>
  );
};
