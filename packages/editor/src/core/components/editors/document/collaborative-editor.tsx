import { Extensions } from "@tiptap/core";
import React, { useMemo } from "react";
// plane imports
import { cn } from "@plane/utils";
// components
import { DocumentContentLoader, PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { WorkItemEmbedExtension } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
// types
import { EditorRefApi, ICollaborativeDocumentEditor } from "@/types";

const CollaborativeDocumentEditor = (props: ICollaborativeDocumentEditor) => {
  const {
    onTransaction,
    aiHandler,
    bubbleMenuEnabled = true,
    containerClassName,
    extensions: externalExtensions = [],
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    editorProps,
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    isDragDropEnabled = true,
    isMobile = false,
    mentionHandler,
    onEditorClick,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
  } = props;

  const extensions: Extensions = useMemo(() => {
    const allExtensions = [...externalExtensions];

    if (embedHandler?.issue) {
      allExtensions.push(
        WorkItemEmbedExtension({
          widgetCallback: embedHandler.issue.widgetCallback,
        })
      );
    }

    return allExtensions;
  }, [externalExtensions, embedHandler.issue]);

  // use document editor
  const { editor, hasServerConnectionFailed, hasServerSynced } = useCollaborativeEditor({
    disabledExtensions,
    editable,
    editorClassName,
    editorProps,
    embedHandler,
    extensions,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    isDragDropEnabled,
    isMobile,
    mentionHandler,
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

  const blockWidthClassName = cn("w-full max-w-[720px] mx-auto transition-all duration-200 ease-in-out", {
    "max-w-[1152px]": displayConfig.wideLayout,
  });

  if (!hasServerSynced && !hasServerConnectionFailed) return <DocumentContentLoader className={blockWidthClassName} />;

  return (
    <PageRenderer
      aiHandler={aiHandler}
      bubbleMenuEnabled={bubbleMenuEnabled}
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={cn(editorContainerClassNames, "document-editor")}
      id={id}
      isMobile={isMobile}
      onEditorClick={onEditorClick}
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
