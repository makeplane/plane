import { Extensions } from "@tiptap/core";
import React, { forwardRef, MutableRefObject } from "react";
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
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// types
import { EditorReadOnlyRefApi, IDocumentReadOnlyEditorProps } from "@/types";

const DocumentReadOnlyEditor: React.FC<IDocumentReadOnlyEditorProps> = (props) => {
  const {
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    embedHandler,
    fileHandler,
    flaggedExtensions,
    id,
    forwardedRef,
    handleEditorReady,
    initialValue,
    mentionHandler,
  } = props;
  const extensions: Extensions = [];
  if (embedHandler?.issue) {
    extensions.push(
      WorkItemEmbedExtension({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  const editor = useReadOnlyEditor({
    disabledExtensions,
    editorClassName,
    extensions,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    initialValue,
    mentionHandler,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;

  return (
    <PageRenderer
      bubbleMenuEnabled={false}
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={cn(editorContainerClassName, "document-editor")}
      id={id}
      disabledExtensions={disabledExtensions}
    />
  );
};

const DocumentReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IDocumentReadOnlyEditorProps>((props, ref) => (
  <DocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditorWithRef };
