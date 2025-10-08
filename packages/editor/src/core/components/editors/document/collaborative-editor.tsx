import React from "react";
// plane imports
import { cn } from "@plane/utils";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
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
    extensions = [],
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    editorProps,
    extendedEditorProps,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    dragDropEnabled = true,
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
    user,
    extendedDocumentEditorProps,
  } = props;

  // use document editor
  const { editor, hasServerConnectionFailed, hasServerSynced } = useCollaborativeEditor({
    disabledExtensions,
    editable,
    editorClassName,
    editorProps,
    extendedEditorProps,
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
    user,
    extendedDocumentEditorProps,
  });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor) return null;

  return (
    <>
      <DocumentEditorSideEffects editor={editor} id={id} extendedEditorProps={extendedEditorProps} />
      <PageRenderer
        aiHandler={aiHandler}
        bubbleMenuEnabled={bubbleMenuEnabled}
        displayConfig={displayConfig}
        documentLoaderClassName={documentLoaderClassName}
        editor={editor}
        editorContainerClassName={cn(editorContainerClassNames, "document-editor")}
        id={id}
        isTouchDevice={!!isTouchDevice}
        isLoading={!hasServerSynced && !hasServerConnectionFailed}
        tabIndex={tabIndex}
        flaggedExtensions={flaggedExtensions}
        disabledExtensions={disabledExtensions}
        extendedDocumentEditorProps={extendedDocumentEditorProps}
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
