import { Extensions } from "@tiptap/core";
import React from "react";
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
    mentionHandler,
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
