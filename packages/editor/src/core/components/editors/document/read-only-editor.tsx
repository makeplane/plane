import { Extensions } from "@tiptap/core";
import React, { forwardRef, MutableRefObject } from "react";
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
// plane editor extensions
import { PageEmbedReadOnlyExtension } from "@/plane-editor/extensions";
import { CustomAttachmentExtension } from "@/plane-editor/extensions/attachments/extension";
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
  const extensions: Extensions = [
    CustomAttachmentExtension({
      fileHandler,
      isFlagged: flaggedExtensions.includes("attachments"),
      isEditable: false,
    }),
  ];
  if (embedHandler?.issue) {
    extensions.push(
      WorkItemEmbedExtension({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  if (embedHandler?.page) {
    extensions.push(
      PageEmbedReadOnlyExtension({
        widgetCallback: embedHandler.page.widgetCallback,
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
      editorContainerClassName={editorContainerClassName}
      id={id}
    />
  );
};

const DocumentReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IDocumentReadOnlyEditorProps>((props, ref) => (
  <DocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditorWithRef };
