import { Extensions } from "@tiptap/core";
import React from "react";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { IssueWidget } from "@/extensions";
import { PageEmbedExtension } from "@/extensions/page-embed";
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
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    pageRestorationInProgress,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
    updatePageProperties,
    isSmoothCursorEnabled = false,
  } = props;

  const extensions: Extensions = [];
  if (embedHandler?.issue) {
    extensions.push(
      IssueWidget({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  if (embedHandler?.page) {
    extensions.push(
      PageEmbedExtension({
        widgetCallback: embedHandler.page.widgetCallback,
        archivePage: embedHandler.page.archivePage,
        unarchivePage: embedHandler.page.unarchivePage,
        deletePage: embedHandler.page.deletePage,
        getPageDetailsCallback: embedHandler.page.getPageDetailsCallback,
      })
    );
  }

  // use document editor
  const { editor, hasServerConnectionFailed, hasServerSynced, titleEditor, isContentInIndexedDb, isIndexedDbSynced } =
    useCollaborativeEditor({
      disabledExtensions,
      editable,
      editorClassName,
      embedHandler,
      extensions,
      fileHandler,
      forwardedRef,
      handleEditorReady,
      id,
      mentionHandler,
      onTransaction,
      placeholder,
      realtimeConfig,
      serverHandler,
      tabIndex,
      user,
      updatePageProperties,
      isSmoothCursorEnabled,
    });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor || !titleEditor) return null;

  // Show minimal loading state during initial IndexedDB sync
  if (!isIndexedDbSynced) {
    return null;
  }

  return (
    <PageRenderer
      aiHandler={aiHandler}
      bubbleMenuEnabled={bubbleMenuEnabled}
      displayConfig={displayConfig}
      editor={editor}
      titleEditor={titleEditor}
      editorContainerClassName={editorContainerClassNames}
      id={id}
      isLoading={(!hasServerSynced && !hasServerConnectionFailed && !isContentInIndexedDb) || pageRestorationInProgress}
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
