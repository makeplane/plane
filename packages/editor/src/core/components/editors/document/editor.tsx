import React, { useState } from "react";
// components
import { PageRenderer } from "@/components/editors";
// extensions
import { IssueWidget } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
// types
import { EditorRefApi, IDocumentEditor } from "@/types";

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    containerClassName,
    editorClassName = "",
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    realtimeConfig,
    tabIndex,
    user,
  } = props;
  // states
  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = useState<() => void>(() => {});
  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

  const extensions = [];
  if (embedHandler?.issue) {
    extensions.push(
      IssueWidget({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  // use document editor
  const { editor } = useCollaborativeEditor({
    id,
    editorClassName,
    embedHandler,
    extensions,
    fileHandler,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    placeholder,
    realtimeConfig,
    setHideDragHandleFunction,
    tabIndex,
    user,
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

export { DocumentEditorWithRef };
