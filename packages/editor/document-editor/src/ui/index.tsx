"use client";
import React from "react";
import {
  UploadImage,
  DeleteImage,
  RestoreImage,
  getEditorClassNames,
  useEditor,
  EditorRefApi,
} from "@plane/editor-document-core";
import { DocumentEditorExtensions } from "src/ui/extensions";
import { useEditorMarkings } from "src/hooks/use-editor-markings";
import { PageRenderer } from "src/ui/components/page-renderer";

interface IDocumentEditor {
  // document info
  title: string;
  value: string;

  // file operations
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  restoreFile: RestoreImage;
  cancelUploadImage: () => any;

  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  updatePageTitle: (title: string) => void;
  isSubmitting: "submitting" | "submitted" | "saved";
  tabIndex?: number;
}

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    title,
    onChange,
    editorContentCustomClassNames,
    value,
    uploadFile,
    deleteFile,
    restoreFile,
    customClassName,
    forwardedRef,
    updatePageTitle,
    cancelUploadImage,
    tabIndex,
  } = props;
  const { updateMarkings } = useEditorMarkings();

  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = React.useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

  const editor = useEditor({
    onChange(json, html) {
      updateMarkings(html);
      onChange(json, html);
    },
    onStart(_json, html) {
      updateMarkings(html);
    },
    restoreFile,
    value,
    uploadFile,
    deleteFile,
    cancelUploadImage,
    forwardedRef,
    extensions: DocumentEditorExtensions(uploadFile, setHideDragHandleFunction),
  });

  if (!editor) {
    return null;
  }

  const editorClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    customClassName,
  });

  if (!editor) return null;

  return (
    <div className="h-full w-full frame-renderer">
      <PageRenderer
        tabIndex={tabIndex}
        hideDragHandle={hideDragHandleOnMouseLeave}
        readonly={false}
        editor={editor}
        editorContentCustomClassNames={editorContentCustomClassNames}
        editorClassNames={editorClassNames}
        title={title}
        updatePageTitle={updatePageTitle}
      />
    </div>
  );
};

const DocumentEditorWithRef = React.forwardRef<EditorRefApi, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef };
