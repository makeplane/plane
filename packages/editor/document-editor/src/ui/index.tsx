import React, { useState } from "react";
import {
  UploadImage,
  DeleteImage,
  RestoreImage,
  getEditorClassNames,
  useEditor,
  EditorRefApi,
  IMentionHighlight,
  IMentionSuggestion,
} from "@plane/editor-core";
import { DocumentEditorExtensions } from "src/ui/extensions";
import { PageRenderer } from "src/ui/components/page-renderer";

interface IDocumentEditor {
  initialValue: string;
  value?: string;
  fileHandler: {
    cancel: () => void;
    delete: DeleteImage;
    upload: UploadImage;
    restore: RestoreImage;
  };
  handleEditorReady?: (value: boolean) => void;
  containerClassName?: string;
  editorClassName?: string;
  onChange: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions: () => Promise<IMentionSuggestion[]>;
  };
  tabIndex?: number;
  placeholder?: string | ((isFocused: boolean) => string);
}

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    onChange,
    initialValue,
    value,
    fileHandler,
    containerClassName,
    editorClassName = "",
    mentionHandler,
    handleEditorReady,
    forwardedRef,
    tabIndex,
    placeholder,
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
    editorClassName,
    restoreFile: fileHandler.restore,
    uploadFile: fileHandler.upload,
    deleteFile: fileHandler.delete,
    cancelUploadImage: fileHandler.cancel,
    initialValue,
    value,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    extensions: DocumentEditorExtensions({
      uploadFile: fileHandler.upload,
      setHideDragHandle: setHideDragHandleFunction,
    }),
    placeholder,
    tabIndex,
  });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor) return null;

  return (
    <PageRenderer
      tabIndex={tabIndex}
      editor={editor}
      editorContainerClassName={editorContainerClassNames}
      hideDragHandle={hideDragHandleOnMouseLeave}
    />
  );
};

const DocumentEditorWithRef = React.forwardRef<EditorRefApi, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef };
