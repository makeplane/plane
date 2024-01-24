"use client";
import React, { useState } from "react";
import { UploadImage, DeleteImage, RestoreImage, getEditorClassNames, useEditor } from "@plane/editor-core";
import { DocumentEditorExtensions } from "src/ui/extensions";
import { IDuplicationConfig, IPageArchiveConfig, IPageLockConfig } from "src/types/menu-actions";
import { EditorHeader } from "src/ui/components/editor-header";
import { useEditorMarkings } from "src/hooks/use-editor-markings";
import { SummarySideBar } from "src/ui/components/summary-side-bar";
import { DocumentDetails } from "src/types/editor-types";
import { PageRenderer } from "src/ui/components/page-renderer";
import { getMenuOptions } from "src/utils/menu-options";
import { useRouter } from "next/router";

interface IDocumentEditor {
  // document info
  documentDetails: DocumentDetails;
  value: string;
  rerenderOnPropsChange?: {
    id: string;
    description_html: string;
  };

  // file operations
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  restoreFile: RestoreImage;
  cancelUploadImage: () => any;

  // editor state managers
  onActionCompleteHandler: (action: {
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }) => void;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  forwardedRef?: any;
  updatePageTitle: (title: string) => void;
  debouncedUpdatesEnabled?: boolean;
  isSubmitting: "submitting" | "submitted" | "saved";

  // embed configuration
  duplicationConfig?: IDuplicationConfig;
  pageLockConfig?: IPageLockConfig;
  pageArchiveConfig?: IPageArchiveConfig;
}
interface DocumentEditorProps extends IDocumentEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
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
  restoreFile,
  isSubmitting,
  customClassName,
  forwardedRef,
  duplicationConfig,
  pageLockConfig,
  pageArchiveConfig,
  updatePageTitle,
  cancelUploadImage,
  onActionCompleteHandler,
  rerenderOnPropsChange,
}: IDocumentEditor) => {
  const { markings, updateMarkings } = useEditorMarkings();
  const [sidePeekVisible, setSidePeekVisible] = useState(true);
  const router = useRouter();

  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = React.useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

  const editor = useEditor({
    onChange(json, html) {
      updateMarkings(json);
      onChange(json, html);
    },
    onStart(json) {
      updateMarkings(json);
    },
    debouncedUpdatesEnabled,
    restoreFile,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    deleteFile,
    cancelUploadImage,
    rerenderOnPropsChange,
    forwardedRef,
    extensions: DocumentEditorExtensions(uploadFile, setHideDragHandleFunction, setIsSubmitting),
  });

  if (!editor) {
    return null;
  }

  const KanbanMenuOptions = getMenuOptions({
    editor: editor,
    router: router,
    duplicationConfig: duplicationConfig,
    pageLockConfig: pageLockConfig,
    pageArchiveConfig: pageArchiveConfig,
    onActionCompleteHandler,
  });

  const editorClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    customClassName,
  });

  if (!editor) return null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <EditorHeader
        readonly={false}
        KanbanMenuOptions={KanbanMenuOptions}
        editor={editor}
        sidePeekVisible={sidePeekVisible}
        setSidePeekVisible={(val) => setSidePeekVisible(val)}
        markings={markings}
        uploadFile={uploadFile}
        setIsSubmitting={setIsSubmitting}
        isLocked={!pageLockConfig ? false : pageLockConfig.is_locked}
        isArchived={!pageArchiveConfig ? false : pageArchiveConfig.is_archived}
        archivedAt={pageArchiveConfig && pageArchiveConfig.archived_at}
        documentDetails={documentDetails}
        isSubmitting={isSubmitting}
      />
      <div className="flex h-full w-full overflow-y-auto frame-renderer">
        <div className="sticky top-0 h-full w-56 flex-shrink-0 lg:w-72">
          <SummarySideBar editor={editor} markings={markings} sidePeekVisible={sidePeekVisible} />
        </div>
        <div className="h-full w-[calc(100%-14rem)] lg:w-[calc(100%-18rem-18rem)] page-renderer">
          <PageRenderer
            onActionCompleteHandler={onActionCompleteHandler}
            hideDragHandle={hideDragHandleOnMouseLeave}
            readonly={false}
            editor={editor}
            editorContentCustomClassNames={editorContentCustomClassNames}
            editorClassNames={editorClassNames}
            documentDetails={documentDetails}
            updatePageTitle={updatePageTitle}
          />
        </div>
        <div className="hidden w-56 flex-shrink-0 lg:block lg:w-72" />
      </div>
    </div>
  );
};

const DocumentEditorWithRef = React.forwardRef<EditorHandle, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef };
