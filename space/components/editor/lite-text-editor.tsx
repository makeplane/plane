import React from "react";
import { LiteTextEditorWithRef, ILiteTextEditor } from "@plane/lite-text-editor";

import fileService from "services/file.service";
import useEditorSuggestions from "hooks/use-editor-suggestions";

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

interface LiteTextEditorWrapperProps
  extends Omit<
    ILiteTextEditor,
    "uploadFile" | "deleteFile" | "restoreFile" | "mentionSuggestions" | "mentionHighlights"
  > {
  workspaceSlug: string;
}

export const LiteTextEditor = React.forwardRef<EditorHandle, LiteTextEditorWrapperProps>(
  ({ workspaceSlug, ...props }, ref) => {
    const mentionsConfig = useEditorSuggestions();

    return (
      <LiteTextEditorWithRef
        ref={ref}
        uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
        deleteFile={fileService.deleteImage}
        restoreFile={fileService.restoreImage}
        mentionHighlights={mentionsConfig.mentionHighlights}
        {...props}
      />
    );
  }
);

LiteTextEditor.displayName = "LiteTextEditor";
