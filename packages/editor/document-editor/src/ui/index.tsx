import React, { useState } from "react";
// editor-core
import {
  getEditorClassNames,
  EditorRefApi,
  IMentionHighlight,
  IMentionSuggestion,
  TFileHandler,
} from "@plane/editor-core";
// components
import { PageRenderer } from "src/ui/components/page-renderer";
// hooks
import { useDocumentEditor } from "src/hooks/use-document-editor";

interface IDocumentEditor {
  id: string;
  value: Uint8Array;
  fileHandler: TFileHandler;
  handleEditorReady?: (value: boolean) => void;
  containerClassName?: string;
  editorClassName?: string;
  onChange: (updates: Uint8Array) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions: () => Promise<IMentionSuggestion[]>;
  };
  tabIndex?: number;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
}

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    onChange,
    id,
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

  // use document editor
  const editor = useDocumentEditor({
    id,
    editorClassName,
    fileHandler,
    value,
    onChange,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    placeholder,
    setHideDragHandleFunction,
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
