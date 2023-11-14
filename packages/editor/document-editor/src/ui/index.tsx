"use client"
import React, { useState } from 'react';
import { cn, getEditorClassNames, useEditor } from '@plane/editor-core';
import { DocumentEditorExtensions } from './extensions';
import { IDuplicationConfig, IPageArchiveConfig, IPageLockConfig } from './types/menu-actions';
import { EditorHeader } from './components/editor-header';
import { useEditorMarkings } from './hooks/use-editor-markings';
import { scrollSummary } from './utils/editor-summary-utils';
import { SummarySideBar } from './components/summary-side-bar';
import { DocumentDetails } from './types/editor-types';
import { PageRenderer } from './components/page-renderer';

export type UploadImage = (file: File) => Promise<string>;
export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

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
  const [sidePeakVisible, setSidePeakVisible] = useState(false)

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
          <SummarySideBar
            editor={editor}
            markings={markings}
            sidePeakVisible={sidePeakVisible}
          />
          <PageRenderer
            editor={editor}
            editorContentCustomClassNames={editorContentCustomClassNames}
            editorClassNames={editorClassNames}
            sidePeakVisible={sidePeakVisible}
            documentDetails={documentDetails}
          />
          {/* Page Element */}
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
