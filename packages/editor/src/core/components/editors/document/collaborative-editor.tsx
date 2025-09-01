// tiptap
import type { Extensions } from "@tiptap/core";
import React, { useMemo } from "react";
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
// constants
import { DocumentEditorSideEffects } from "@/plane-editor/components/document-editor-side-effects";
// types
import type { EditorRefApi, ICollaborativeDocumentEditorProps } from "@/types";

const CollaborativeDocumentEditor: React.FC<ICollaborativeDocumentEditorProps> = (props) => {
  const {
    aiHandler,
    bubbleMenuEnabled = true,
    containerClassName,
    documentLoaderClassName,
    extensions: externalExtensions = [],
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    editorProps,
    embedHandler,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    dragDropEnabled = true,
    isTouchDevice,
    mentionHandler,
    pageRestorationInProgress,
    onAssetChange,
    onChange,
    onEditorFocus,
    onTransaction,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    titleRef,
    user,
    updatePageProperties,
    // additional props
    extendedEditorProps,
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
  const { editor, hasServerConnectionFailed, hasServerSynced, titleEditor, isContentInIndexedDb, isIndexedDbSynced } =
    useCollaborativeEditor({
      disabledExtensions,
      editable,
      editorClassName,
      editorProps,
      embedHandler,
      extensions,
      fileHandler,
      flaggedExtensions,
      forwardedRef,
      handleEditorReady,
      id,
      dragDropEnabled,
      isTouchDevice,
      mentionHandler,
      onAssetChange,
      onChange,
      onEditorFocus,
      onTransaction,
      placeholder,
      realtimeConfig,
      serverHandler,
      tabIndex,
      titleRef,
      updatePageProperties,
      user,
      extendedEditorProps,
    });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor || !titleEditor) return null;

  if (!isIndexedDbSynced) {
    return null;
  }

  return (
    <>
      <DocumentEditorSideEffects
        editor={editor}
        id={id}
        updatePageProperties={updatePageProperties}
        extendedEditorProps={extendedEditorProps}
      />
      <PageRenderer
        aiHandler={aiHandler}
        bubbleMenuEnabled={bubbleMenuEnabled}
        displayConfig={displayConfig}
        documentLoaderClassName={documentLoaderClassName}
        disabledExtensions={disabledExtensions}
        editor={editor}
        flaggedExtensions={flaggedExtensions}
        titleEditor={titleEditor}
        editorContainerClassName={cn(editorContainerClassNames, "document-editor")}
        extendedEditorProps={extendedEditorProps}
        id={id}
        isLoading={
          (!hasServerSynced && !hasServerConnectionFailed && !isContentInIndexedDb) || pageRestorationInProgress
        }
        isTouchDevice={!!isTouchDevice}
        tabIndex={tabIndex}
      />
    </>
  );
};

const CollaborativeDocumentEditorWithRef = React.forwardRef<EditorRefApi, ICollaborativeDocumentEditorProps>(
  (props, ref) => <CollaborativeDocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi>} />
);

CollaborativeDocumentEditorWithRef.displayName = "CollaborativeDocumentEditorWithRef";

export { CollaborativeDocumentEditorWithRef };
