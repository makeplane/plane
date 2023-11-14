"use client"
import React, { useState } from 'react';
import { EditorContainer, EditorContentWrapper, cn, getEditorClassNames, useEditor } from '@plane/editor-core';
import { DocumentEditorExtensions } from './extensions';
import { ContentBrowser } from './components/content-browser';
import { IDuplicationConfig, IPageArchiveConfig, IPageLockConfig } from './types/menu-actions';
import { EditorHeader } from './components/editor-header';
import { useEditorMarkings } from './hooks/use-editor-markings';
import { scrollSummary } from './utils/editor-summary-utils';

export type UploadImage = (file: File) => Promise<string>;
export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

interface DocumentDetails {
  title: string;
}

interface IDocumentEditor {
  documentDetails: DocumentDetails,
  value: string;
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  forwardedRef?: any;
  debouncedUpdatesEnabled?: boolean;
  duplicationConfig?: IDuplicationConfig,
  pageLockConfig?: IPageLockConfig,
  pageArchiveConfig?: IPageArchiveConfig
}
interface DocumentEditorProps extends IDocumentEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

export interface IMarking {
  type: "heading",
  level: number,
  text: string,
  sequence: number
}

const DocumentEditor = ({
  documentDetails,
  onChange,
  debouncedUpdatesEnabled,
  setIsSubmitting,
  setShouldShowAlert,
  editorContentCustomClassNames,
  value,
  uploadFile,
  deleteFile,
  customClassName,
  forwardedRef,
  duplicationConfig,
  pageLockConfig,
  pageArchiveConfig
}: IDocumentEditor) => {

  // const [alert, setAlert] = useState<string>("")
  const { markings, updateMarkings } = useEditorMarkings()
  const [ sidePeakVisible, setSidePeakVisible ] = useState(false)

  const editor = useEditor({
    onChange(json, html) {
      updateMarkings(json)
      onChange(json, html)
    },
    onStart(json) {
      updateMarkings(json)
    },
    debouncedUpdatesEnabled,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    deleteFile,
    forwardedRef,
    extensions: DocumentEditorExtensions(uploadFile, setIsSubmitting),
  });

  if (!editor) {
    return null
  }

  const editorClassNames = getEditorClassNames({ noBorder: true, borderOnFocus: false, customClassName });

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      <EditorHeader
        editor={editor}
        duplicationConfig={duplicationConfig}
        pageLockConfig={pageLockConfig}
        pageArchiveConfig={pageArchiveConfig}
        sidePeakVisible={sidePeakVisible}
        setSidePeakVisible={setSidePeakVisible}
        markings={markings}
        scrollSummary={scrollSummary}
        uploadFile={uploadFile}
        setIsSubmitting={setIsSubmitting}
      />
      <div className="self-center items-stretch w-full max-md:max-w-full h-full">
        <div className={cn("gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0 h-full", { "justify-center": !sidePeakVisible })}>
          <div className={`flex flex-col items-stretch w-[21%] max-md:w-full max-md:ml-0 border-custom-border border-r border-solid transition-all duration-200 ease-in-out transform ${sidePeakVisible ? 'translate-x-0' : '-translate-x-full'}`}>
            <ContentBrowser editor={editor} markings={markings} scrollSummary={scrollSummary} />
          </div>
          {/* Page Element */}
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
        </div>
      </div>
    </div>
  );
}


const DocumentEditorWithRef = React.forwardRef<EditorHandle, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef }
