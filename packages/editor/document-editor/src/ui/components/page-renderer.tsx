import { EditorContainer, EditorContentWrapper } from "@plane/editor-core";
import { Editor } from "@tiptap/react";
import { DocumentDetails } from "../types/editor-types";

interface IPageRenderer {
  sidePeakVisible: boolean;
  documentDetails: DocumentDetails;
  editor: Editor;
  editorClassNames: string;
  editorContentCustomClassNames?: string;
}

export const PageRenderer = ({
  sidePeakVisible,
  documentDetails,
  editor,
  editorClassNames,
  editorContentCustomClassNames,
}: IPageRenderer) => {
  return (
    <div
      className={`flex h-[88vh] flex-col w-full max-md:w-full max-md:ml-0  transition-all duration-200 ease-in-out ${
        sidePeakVisible ? "ml-[3%] " : "ml-0"
      }`}
    >
      <div className="items-start mt-4 h-full flex flex-col w-fit max-md:max-w-full overflow-auto">
        <div className="flex flex-col py-2 max-md:max-w-full">
          <h1 className="border-none outline-none bg-transparent text-4xl font-bold leading-8 tracking-tight self-center w-[700px] max-w-full">
            {documentDetails.title}
          </h1>
        </div>
        <div className="border-b border-custom-border-200 self-stretch w-full h-0.5 mt-3" />
        <div className="flex flex-col h-full w-full max-md:max-w-full">
          <EditorContainer editor={editor} editorClassNames={editorClassNames}>
            <div className="flex flex-col h-full w-full">
              <EditorContentWrapper
                editor={editor}
                editorContentCustomClassNames={editorContentCustomClassNames}
              />
            </div>
          </EditorContainer>
        </div>
      </div>
    </div>
  );
};
