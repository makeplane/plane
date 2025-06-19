import { Extensions } from "@tiptap/core";
import React, { useMemo } from "react";
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
    onChange,
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
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    pageRestorationInProgress,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    titleRef,
    user,
    updatePageProperties,
    isSmoothCursorEnabled = false,
  } = props;

  const extensions: Extensions = useMemo(() => {
    const ext: Extensions = [];
    if (embedHandler?.issue) {
      ext.push(
        WorkItemEmbedExtension({
          widgetCallback: embedHandler.issue.widgetCallback,
        })
      );
    }
    return ext;
  }, [embedHandler]);

  // use document editor
  const { editor, hasServerConnectionFailed, hasServerSynced, titleEditor, isContentInIndexedDb, isIndexedDbSynced } =
    useCollaborativeEditor({
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
      isSmoothCursorEnabled,
      mentionHandler,
      onChange,
      onTransaction,
      placeholder,
      realtimeConfig,
      serverHandler,
      tabIndex,
      titleRef,
      updatePageProperties,
      user,
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

const CollaborativeDocumentEditorWithRef = React.forwardRef<EditorRefApi, ICollaborativeDocumentEditorProps>(
  (props, ref) => (
    <CollaborativeDocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
  )
);

CollaborativeDocumentEditorWithRef.displayName = "CollaborativeDocumentEditorWithRef";

export { CollaborativeDocumentEditorWithRef };
