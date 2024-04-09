import React from "react";

import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/lite-text-editor";
import { cn } from "@/helpers/common.helper";
import { useMention } from "@/hooks/use-mention";

import { FileService } from "services/file.service";

interface LiteTextEditorWrapperProps extends Omit<ILiteTextEditor, "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
}

const fileService = new FileService();

export const LiteTextEditor = React.forwardRef<EditorRefApi, LiteTextEditorWrapperProps>(
  ({ workspaceSlug, workspaceId, ...props }, ref) => {
    const { mentionHighlights } = useMention();

    return (
      <LiteTextEditorWithRef
        ref={ref}
        fileHandler={{
          upload: fileService.getUploadFileFunction(workspaceSlug),
          delete: fileService.getDeleteImageFunction(workspaceId),
          restore: fileService.getRestoreImageFunction(workspaceId),
          cancel: fileService.cancelUpload,
        }}
        mentionHandler={{
          highlights: mentionHighlights,
          // suggestions disabled for now
        }}
        {...props}
        // overriding the customClassName to add relative class passed
        customClassName={cn(props.customClassName, "relative")}
      />
    );
  }
);

LiteTextEditor.displayName = "LiteTextEditor";
