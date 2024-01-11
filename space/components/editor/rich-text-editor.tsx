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
    "uploadFile" | "deleteFile" | "restoreFile" | "mentionSuggestions" | "mentionHighlights"
  > {
  workspaceSlug: string;
}

const fileService = new FileService();

export const RichTextEditor = React.forwardRef<EditorHandle, RichTextEditorWrapperProps>(
  ({ workspaceSlug, ...props }, ref) => {
    const editorSuggestions = useMention();

    return (
      <RichTextEditorWithRef
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

RichTextEditor.displayName = "RichTextEditor";
