import React from "react";

import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef } from "@plane/rich-text-editor";
import { cn } from "@/helpers/common.helper";
import { useMention } from "hooks/store";

import { FileService } from "services/file.service";

interface RichTextEditorWrapperProps extends Omit<IRichTextEditor, "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
}

const fileService = new FileService();

export const RichTextEditor = React.forwardRef<EditorRefApi, RichTextEditorWrapperProps>(
  ({ workspaceSlug, workspaceId, projectId, ...props }, ref) => {
    const { mentionHighlights, mentionSuggestions } = useMention({
      workspaceSlug: workspaceSlug as string,
      projectId: projectId as string,
    });

    return (
      <RichTextEditorWithRef
        ref={ref}
        fileHandler={{
          upload: fileService.getUploadFileFunction(workspaceSlug),
          delete: fileService.getDeleteImageFunction(workspaceId),
          restore: fileService.getRestoreImageFunction(workspaceId),
          cancel: fileService.cancelUpload,
        }}
        mentionHandler={{
          highlights: mentionHighlights,
          suggestions: mentionSuggestions,
        }}
        {...props}
        // overriding the customClassName to add relative class passed
        customClassName={cn(props.customClassName, "relative")}
      />
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
