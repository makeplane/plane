"use client"
import React, { useState } from 'react';
import { Editor } from "@tiptap/core";
import { EditorContainer, EditorContentWrapper, cn, getEditorClassNames, useEditor } from '@plane/editor-core';
import { DocumentEditorExtensions } from './extensions';
import { FixedMenu } from './menu';
import { AlertCircle, FileLineChart, MenuSquare, MoreVertical } from 'lucide-react';


export type UploadImage = (file: File) => Promise<string>;
export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

interface IDocumentEditor {
  value: string;
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  forwardedRef?: any;
  debouncedUpdatesEnabled?: boolean;
}

interface DocumentEditorProps extends IDocumentEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

interface Marking {
  type: "heading",
  level: number,
  text: string,
  sequence: number
}

const HeadingComp = ({ heading, onClick }: { heading: string, onClick: (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>) => void; }) => (
  <h3 onClick={onClick} className="cursor-pointer font-bold text-sm font-medium leading-[125%] hover:text-custom-primary tracking-tight ml-4 mt-3 max-md:ml-2.5">
    {heading}
  </h3>
)

const SubheadingComp = ({ subHeading, onClick }: { subHeading: string, onClick: (event: React.MouseEvent<HTMLParagraphElement, MouseEvent>) => void; }) => (
  <p onClick={onClick} className="text-xs font-medium leading-[150%] text-gray-400 hover:text-custom-primary tracking-tight ml-4 mt-2">
    {subHeading}
  </p>
)


const DocumentEditor = ({
  debouncedUpdatesEnabled,
  setIsSubmitting,
  setShouldShowAlert,
  editorContentCustomClassNames,
  value,
  uploadFile,
  deleteFile,
  customClassName,
  forwardedRef,
}: IDocumentEditor) => {

  const [markings, setMarkings] = useState<Marking[]>([])

  const onChange = (json: any, html: string) => {
    const nodes = json.content as any[]
    const tempMarkings: Marking[] = []
    let h1Sequence: number = 0
    let h2Sequence: number = 0
    if (nodes) {
      nodes.forEach((node) => {
        if (node.type === "heading" && ( node.attrs.level === 1 || node.attrs.level === 2 ) && node.content) {
          tempMarkings.push({
            type: "heading",
            level: node.attrs.level,
            text: node.content[0].text,
            sequence: node.attrs.level === 1 ? ++h1Sequence : ++h2Sequence
          })
        }
      })
    }
    setMarkings(tempMarkings)
  }

  const editor = useEditor({
    onChange,
    debouncedUpdatesEnabled,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    deleteFile,
    forwardedRef,
    extensions: DocumentEditorExtensions(uploadFile, setIsSubmitting),
  });

  function findNthH1(editor: Editor, n: number, level: number): number {
    let count = 0;
    let pos = 0;
    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'heading' && node.attrs.level === level) {
        count++;
        if (count === n) {
          pos = position;
          return false;
        }
      }
    });
    return pos;
  }

  function scrollToNode(editor: Editor, pos: number): void {
    const headingNode = editor.state.doc.nodeAt(pos);
    if (headingNode) {
      const headingDOM = editor.view.nodeDOM(pos);
      if (headingDOM instanceof HTMLElement) {
        headingDOM.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function scrollSummary(marking: Marking) {
    if (editor) {
      console.log(marking)
      const pos = findNthH1(editor, marking.sequence, marking.level)
      scrollToNode(editor, pos)
    }
  }

  const editorClassNames = getEditorClassNames({ noBorder: true, borderOnFocus: false, customClassName });

  const [sidePeakVisible, setSidePeakVisible] = useState(false)

  if (!editor) return null;

  return (
    <main className="flex flex-col h-full">
      <header className="border-custom-border self-stretch flex flex-col border-b border-solid max-md:max-w-full">
        <nav className="self-center flex ml-0 w-full items-start justify-between gap-5 max-md:max-w-full max-md:flex-wrap max-md:justify-center">
          <button
            className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
            onClick={() => setSidePeakVisible(!sidePeakVisible)}
          >
            <MenuSquare
              size={20}
            />
          </button>
          <FixedMenu editor={editor} uploadFile={uploadFile} setIsSubmitting={setIsSubmitting} />
          <div className="self-center flex items-start gap-3 my-auto max-md:justify-center"
          >
            <button
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
            >
              <FileLineChart
                size={20}
              />
            </button>
            <button
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
            >
              <AlertCircle
                size={20}
              />
            </button>
            <button
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
            >
              <MoreVertical
                size={20}
              />
            </button>
          </div>
        </nav>
      </header>
      {/* <section className="items-start self-center flex w-[892px] max-w-full flex-col mt-7 mb-[478px]"> */}
      <section className="self-center items-stretch w-full max-md:max-w-full h-full">
        <div className={cn("gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0 h-full", { "justify-center": !sidePeakVisible })}>
          <aside className={`flex flex-col items-stretch w-[21%] max-md:w-full max-md:ml-0 border-custom-border border-r border-solid transition-all duration-200 ease-in-out transform ${sidePeakVisible ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col w-[250px] mt-4 h-full">
              <h2 className="font-medium py-5 border-custom-border border-b border-solid leading-[85.714%] tracking-tight ml-4 max-md:ml-2.5">
                Summary
              </h2>
              <div className="border-custom-border self-stretch w-full h-0.5 mt-3" />
              {markings.length !== 0 ? markings.map((marking) => marking.level === 1
                ? <HeadingComp onClick={() => scrollSummary(marking)} heading={marking.text} />
                : <SubheadingComp onClick={() => scrollSummary(marking)} subHeading={marking.text} />) : <p className="px-5 ml-3 mr-3 text-gray-500 text-xs text-center flex items-center h-full">{"Headings will be displayed here for Navigation"}</p>
              }
            </div>
          </aside>
          {/* Page Element */}
          <div className={`flex h-full flex-col w-[90%] max-md:w-full max-md:ml-0  transition-all duration-200 ease-in-out ${sidePeakVisible ? 'ml-[12%] w-[79%]' : 'ml-0 w-[90%]'}`}>
            <div className="items-start h-full flex flex-col w-[892px] mt-8 max-md:max-w-full overflow-auto">
              <div className="flex flex-col py-2 max-md:max-w-full">
                <input
                  type="text"
                  value={"Page Title"}
                  onChange={(e) => { console.log(e.target.value) }}
                  className="border-none outline-none bg-transparent text-4xl font-bold leading-8 tracking-tight self-center w-[700px] max-w-full"
                />
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
        </div>
      </section>
    </main>
  );
}


const DocumentEditorWithRef = React.forwardRef<EditorHandle, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef }