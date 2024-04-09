import React from "react";
// editor
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/lite-text-editor";
// components
import { IssueCommentToolbar } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { isEmptyHtmlString } from "@/helpers/string.helper";
// hooks
import { useMention } from "@/hooks/use-mention";
// services
import fileService from "@/services/file.service";

interface LiteTextEditorWrapperProps extends Omit<ILiteTextEditor, "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  isSubmitting?: boolean;
  showSubmitButton?: boolean;
}

export const LiteTextEditor = React.forwardRef<EditorRefApi, LiteTextEditorWrapperProps>((props, ref) => {
  const { customClassName, workspaceSlug, workspaceId, isSubmitting = false, showSubmitButton = true, ...rest } = props;
  // use-mention
  const { mentionHighlights } = useMention();

  const isEmpty =
    props.initialValue === "" ||
    props.initialValue?.trim() === "" ||
    props.initialValue === "<p></p>" ||
    isEmptyHtmlString(props.initialValue ?? "");

  return (
    <div className="border border-custom-border-200 rounded p-3 space-y-3">
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
        {...rest}
        // overriding the customClassName to add relative class passed
        customClassName={cn(customClassName, "relative")}
      />
      <IssueCommentToolbar
        executeCommand={(key) => ref?.current?.executeMenuItemCommand(key)}
        handleSubmit={(e) => rest.onEnterKeyPress?.(e)}
        isActive={(key) => ref?.current?.isMenuItemActive(key)}
        isCommentEmpty={isEmpty}
        isSubmitting={isSubmitting}
        showSubmitButton={showSubmitButton}
      />
    </div>
  );
});

LiteTextEditor.displayName = "LiteTextEditor";
