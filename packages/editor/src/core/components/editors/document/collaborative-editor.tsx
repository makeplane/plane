import React from "react";
// components
import { DocumentContentLoader, PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { IssueWidget } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
// types
import { EditorRefApi, ICollaborativeDocumentEditor } from "@/types";

const CollaborativeDocumentEditor = (props: ICollaborativeDocumentEditor) => {
  const {
    aiHandler,
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
  } = props;

  const extensions = [];
  if (embedHandler?.issue) {
    extensions.push(
      IssueWidget({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  // use document editor
  const { editor, hasServerConnectionFailed, hasServerSynced } = useCollaborativeEditor({
    disabledExtensions,
    editorClassName,
    embedHandler,
    extensions,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
  });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor) return null;

  if (!hasServerSynced && !hasServerConnectionFailed) return <DocumentContentLoader />;

  return (
    <PageRenderer
      displayConfig={displayConfig}
      aiHandler={aiHandler}
      editor={editor}
      editorContainerClassName={editorContainerClassNames}
      id={id}
      tabIndex={tabIndex}
    />
  );
};

const CollaborativeDocumentEditorWithRef = React.forwardRef<EditorRefApi, ICollaborativeDocumentEditor>(
  (props, ref) => (
    <CollaborativeDocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
  )
);

CollaborativeDocumentEditorWithRef.displayName = "CollaborativeDocumentEditorWithRef";

export { CollaborativeDocumentEditorWithRef };
