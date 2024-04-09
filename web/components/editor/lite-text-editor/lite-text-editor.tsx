import React from "react";
// editor
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/lite-text-editor";
// components
import { IssueCommentToolbar } from "@/components/editor";
// constants
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { isEmptyHtmlString } from "@/helpers/string.helper";
// hooks
import { useMention } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";

interface LiteTextEditorWrapperProps extends Omit<ILiteTextEditor, "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  accessSpecifier?: EIssueCommentAccessSpecifier;
  handleAccessChange?: (accessKey: EIssueCommentAccessSpecifier) => void;
  showAccessSpecifier?: boolean;
  showSubmitButton?: boolean;
  isSubmitting?: boolean;
}

const fileService = new FileService();

export const LiteTextEditor = React.forwardRef<EditorRefApi, LiteTextEditorWrapperProps>((props, ref) => {
  const {
    customClassName,
    workspaceSlug,
    workspaceId,
    projectId,
    accessSpecifier,
    handleAccessChange,
    showAccessSpecifier = false,
    showSubmitButton = true,
    isSubmitting = false,
    ...rest
  } = props;
  // use-mention
  const { mentionHighlights, mentionSuggestions } = useMention({
    workspaceSlug: workspaceSlug as string,
    projectId: projectId as string,
  });

  const isEmpty =
    props.initialValue === "" ||
    props.initialValue?.trim() === "" ||
    props.initialValue === "<p></p>" ||
    isEmptyHtmlString(props.initialValue ?? "");

  function isMutableRefObject<T>(ref: React.ForwardedRef<T>): ref is React.MutableRefObject<T | null> {
    return !!ref && typeof ref === "object" && "current" in ref;
  }

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
          suggestions: mentionSuggestions,
        }}
        {...rest}
        customClassName={cn(customClassName, "relative")}
      />
      <IssueCommentToolbar
        accessSpecifier={accessSpecifier}
        executeCommand={(key) => {
          if (isMutableRefObject<EditorRefApi>(ref)) {
            ref.current?.executeMenuItemCommand(key);
          }
        }}
        handleAccessChange={handleAccessChange}
        handleSubmit={(e) => rest.onEnterKeyPress?.(e)}
        isCommentEmpty={isEmpty}
        isSubmitting={isSubmitting}
        showAccessSpecifier={showAccessSpecifier}
        editorRef={isMutableRefObject<EditorRefApi>(ref) ? ref : null}
        showSubmitButton={showSubmitButton}
      />
    </div>
  );
});

LiteTextEditor.displayName = "LiteTextEditor";
