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
  title: string;
  value: string;
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  restoreFile: RestoreImage;
  cancelUploadImage: () => any;
  handleEditorReady: (value: boolean) => void;
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
    handleEditorReady,
    forwardedRef,
    updatePageTitle,
    cancelUploadImage,
    tabIndex,
  } = props;

  console.log("DocumentEditor: Received forwardedRef", forwardedRef?.current);

  const { updateMarkings } = useEditorMarkings();

  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = React.useState<() => void>(() => {});

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
    handleEditorReady,
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

  return (
    <div className="frame-renderer h-full w-full">
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

const DocumentEditorWithRef = React.forwardRef<EditorRefApi, IDocumentEditor>((props, ref) => {
  console.log("DocumentEditorWithRef: Forwarding ref", ref);
  return <DocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />;
});

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef };
