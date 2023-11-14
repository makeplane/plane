import { EditorContainer, EditorContentWrapper } from "@plane/editor-core"
import { Editor } from "@tiptap/react"
import { DocumentDetails } from "../types/editor-types"

interface IPageRenderer {
  sidePeakVisible: boolean,
  documentDetails: DocumentDetails ,
  editor: Editor,
  editorClassNames: string, 
  editorContentCustomClassNames: string | undefined
}

export const PageRenderer = ({ sidePeakVisible, documentDetails, editor, editorClassNames, editorContentCustomClassNames }: IPageRenderer) => {
  return (
    <div className={`flex h-full flex-col w-[90%] max-md:w-full max-md:ml-0  transition-all duration-200 ease-in-out ${sidePeakVisible ? 'ml-[12%] w-[79%]' : 'ml-0 w-[90%]'}`}>
      <div className="items-start h-full flex flex-col w-[892px] mt-8 max-md:max-w-full overflow-auto">
        <div className="flex flex-col py-2 max-md:max-w-full">
          <h1
            className="border-none outline-none bg-transparent text-4xl font-bold leading-8 tracking-tight self-center w-[700px] max-w-full"
          >{documentDetails.title}</h1>
        </div>
        <div className="border-custom-border border-b border-solid self-stretch w-full h-0.5 mt-3" />
        <div className="h-full items-start flex flex-col max-md:max-w-full">
          <EditorContainer editor={editor} editorClassNames={editorClassNames}>
            <div className="flex flex-col h-full">
              <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
            </div>
          </EditorContainer >
        </div>
      </div>
    </div>
  )
}
