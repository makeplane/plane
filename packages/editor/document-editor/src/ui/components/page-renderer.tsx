import { EditorContainer, EditorContentWrapper } from "@plane/editor-core";
import { Editor } from "@tiptap/react";
import { DocumentDetails } from "../types/editor-types";

interface IPageRenderer {
  documentDetails: DocumentDetails;
  editor: Editor;
  editorClassNames: string;
  editorContentCustomClassNames?: string;
}

export const PageRenderer = (props: IPageRenderer) => {
  const {
    documentDetails,
    editor,
    editorClassNames,
    editorContentCustomClassNames,
  } = props;

  return (
    <div className="w-full pl-7 pt-5 pb-64">
      <h1 className="text-4xl font-bold break-words pr-5 -mt-2">
        {documentDetails.title}
      </h1>
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
