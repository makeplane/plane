import { Extensions } from "@tiptap/core";
import React from "react";
// plane imports
import { cn } from "@plane/utils";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { WorkItemEmbedExtension } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
// types
import { EditorRefApi, ICollaborativeDocumentEditorProps } from "@/types";

const CollaborativeDocumentEditor: React.FC<ICollaborativeDocumentEditorProps> = (props) => {
  const {
    aiHandler,
    bubbleMenuEnabled = true,
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    embedHandler,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    isTouchDevice,
    mentionHandler,
    onAssetChange,
    onChange,
    onTransaction,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
  } = props;

  const extensions: Extensions = [];

  if (embedHandler?.issue) {
    extensions.push(
      WorkItemEmbedExtension({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  // use document editor
  const { editor, hasServerConnectionFailed, hasServerSynced } = useCollaborativeEditor({
    disabledExtensions,
    editable,
    editorClassName,
    embedHandler,
    extensions,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    isTouchDevice,
    mentionHandler,
    onAssetChange,
    onChange,
    onTransaction,
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

  return (
    <PageRenderer
      aiHandler={aiHandler}
      bubbleMenuEnabled={bubbleMenuEnabled}
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={cn(editorContainerClassNames, "document-editor")}
      id={id}
      isTouchDevice={!!isTouchDevice}
      isLoading={!hasServerSynced && !hasServerConnectionFailed}
      tabIndex={tabIndex}
    />
  );
};

const CollaborativeDocumentEditorWithRef = React.forwardRef<EditorRefApi, ICollaborativeDocumentEditorProps>(
  (props, ref) => (
    <CollaborativeDocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
  )
);

CollaborativeDocumentEditorWithRef.displayName = "CollaborativeDocumentEditorWithRef";

export { CollaborativeDocumentEditorWithRef };
