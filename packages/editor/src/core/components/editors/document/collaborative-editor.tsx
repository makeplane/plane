import type { Extensions } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import React, { useEffect, useMemo } from "react";
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
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// hooks
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
// types
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
import type { EditorRefApi, EventToPayloadMap, ICollaborativeDocumentEditorProps } from "@/types";

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
    extensionOptions,
    isSmoothCursorEnabled = false,
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
      // additional props
      extensionOptions,
      isSmoothCursorEnabled,
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
      <RealtimeEventsHandler editor={editor} id={id} updatePageProperties={updatePageProperties} />
      <PageRenderer
        aiHandler={aiHandler}
        bubbleMenuEnabled={bubbleMenuEnabled}
        displayConfig={displayConfig}
        documentLoaderClassName={documentLoaderClassName}
        editor={editor}
        titleEditor={titleEditor}
        editorContainerClassName={cn(editorContainerClassNames, "document-editor")}
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
  (props, ref) => (
    <CollaborativeDocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
  )
);

CollaborativeDocumentEditorWithRef.displayName = "CollaborativeDocumentEditorWithRef";

export { CollaborativeDocumentEditorWithRef };

const RealtimeEventsHandler = ({ editor, id, updatePageProperties }) => {
  const { users } = useEditorState({
    editor,
    selector: (ctx) => ({
      users: getExtensionStorage(ctx.editor, ADDITIONAL_EXTENSIONS.COLLABORATION_CURSOR)?.users || [],
    }),
  });

  // Update page properties when collaborators change
  useEffect(() => {
    if (!users || !updatePageProperties) return;

    const currentUsers = users;

    const collaboratorPayload: EventToPayloadMap["collaborators-updated"] = {
      users: currentUsers,
    };

    updatePageProperties(id, "collaborators-updated", collaboratorPayload, false);
  }, [users, updatePageProperties, id, editor]);

  return null;
};
