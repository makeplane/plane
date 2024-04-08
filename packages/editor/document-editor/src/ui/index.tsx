import React, { useState } from "react";
import {
  UploadImage,
  DeleteImage,
  RestoreImage,
  getEditorClassNames,
  useEditor,
  EditorRefApi,
} from "@plane/editor-document-core";
import { DocumentEditorExtensions } from "src/ui/extensions";
import { PageRenderer } from "src/ui/components/page-renderer";
import { IMentionHighlight, IMentionSuggestion } from "@plane/editor-core";

interface IDocumentEditor {
  title: string;
  value: string;
  updatedValue?: string;
  fileHandler: {
    cancel: () => void;
    delete: DeleteImage;
    upload: UploadImage;
    restore: RestoreImage;
  };
  handleEditorReady?: (value: boolean) => void;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions: () => Promise<IMentionSuggestion[]>;
  };
  updatePageTitle: (title: string) => void;
  tabIndex?: number;
}

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    title,
    onChange,
    editorContentCustomClassNames,
    value,
    updatedValue = "",
    fileHandler,
    customClassName,
    mentionHandler,
    handleEditorReady,
    forwardedRef,
    updatePageTitle,
    tabIndex,
  } = props;
  // states
  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };
  // use editor
  const editor = useEditor({
    onChange(json, html) {
      onChange(json, html);
    },
    restoreFile: fileHandler.restore,
    value,
    updatedValue,
    uploadFile: fileHandler.upload,
    handleEditorReady,
    deleteFile: fileHandler.delete,
    cancelUploadImage: fileHandler.cancel,
    forwardedRef,
    mentionHandler,
    extensions: DocumentEditorExtensions(fileHandler.upload, setHideDragHandleFunction),
  });

  const editorClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    customClassName,
  });

  if (!editor) return null;

  return (
    <PageRenderer
      tabIndex={tabIndex}
      readonly={false}
      editor={editor}
      editorContentCustomClassNames={editorContentCustomClassNames}
      editorClassNames={editorClassNames}
      hideDragHandle={hideDragHandleOnMouseLeave}
      title={title}
      updatePageTitle={updatePageTitle}
    />
  );
};

const DocumentEditorWithRef = React.forwardRef<EditorRefApi, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef };
