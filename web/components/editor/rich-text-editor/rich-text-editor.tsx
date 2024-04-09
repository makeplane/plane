import React from "react";
// editor
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef } from "@plane/rich-text-editor";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMention } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";

interface RichTextEditorWrapperProps extends Omit<IRichTextEditor, "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
}

const fileService = new FileService();

export const RichTextEditor = React.forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { customClassName, workspaceSlug, workspaceId, projectId, ...rest } = props;
  // use-mention
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
      {...rest}
      customClassName={cn(customClassName, "relative min-h-[150px] border border-custom-border-200 p-3")}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
