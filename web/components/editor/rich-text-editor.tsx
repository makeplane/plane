import React from "react";
import { RichTextEditorWithRef, IRichTextEditor } from "@plane/rich-text-editor";

import { useMention } from "hooks/store";

import { FileService } from "services/file.service";

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

interface RichTextEditorWrapperProps
  extends Omit<
    IRichTextEditor,
    "uploadFile" | "deleteFile" | "cancelUploadImage" | "restoreFile" | "mentionSuggestions" | "mentionHighlights"
  > {
  workspaceSlug: string;
  workspaceId: string;
}

const fileService = new FileService();

export const RichTextEditor = React.forwardRef<EditorHandle, RichTextEditorWrapperProps>(
  ({ workspaceSlug, workspaceId, ...props }, ref) => {
    const editorSuggestions = useMention();

    return (
      <RichTextEditorWithRef
        ref={ref}
        uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
        deleteFile={fileService.getDeleteImageFunction(workspaceId)}
        restoreFile={fileService.getRestoreImageFunction(workspaceId)}
        cancelUploadImage={fileService.cancelUpload}
        mentionSuggestions={editorSuggestions.mentionSuggestions}
        mentionHighlights={editorSuggestions.mentionHighlights}
        {...props}
      />
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
