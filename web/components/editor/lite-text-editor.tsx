import React from "react";
import { LiteTextEditorWithRef, ILiteTextEditor } from "@plane/lite-text-editor";

import { useMention } from "hooks/store";

import { FileService } from "services/file.service";

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

const fileService = new FileService();

export const LiteTextEditor = React.forwardRef<EditorHandle, LiteTextEditorWrapperProps>(
  ({ workspaceSlug, ...props }, ref) => {
    const editorSuggestions = useMention();

    return (
      <LiteTextEditorWithRef
        ref={ref}
        uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
        deleteFile={fileService.deleteImage}
        restoreFile={fileService.restoreImage}
        mentionSuggestions={editorSuggestions.mentionSuggestions}
        mentionHighlights={editorSuggestions.mentionHighlights}
        {...props}
      />
    );
  }
);

LiteTextEditor.displayName = "LiteTextEditor";
