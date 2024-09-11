import React from "react";
// editor
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// components
import { IssueCommentToolbar } from "@/components/editor";
// constants
import { EIssueCommentAccessSpecifier } from "@/constants/issue";
// helpers
import { cn } from "@/helpers/common.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useMember, useMention, useUser } from "@/hooks/store";
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
    containerClassName,
    workspaceSlug,
    workspaceId,
    projectId,
    accessSpecifier,
    handleAccessChange,
    showAccessSpecifier = false,
    showSubmitButton = true,
    isSubmitting = false,
    placeholder = "Add comment...",
    ...rest
  } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const projectMemberIds = getProjectMemberIds(projectId);
  const projectMemberDetails = projectMemberIds?.map((id) => getUserDetails(id) as IUserLite);
  // use-mention
  const { mentionHighlights, mentionSuggestions } = useMention({
    workspaceSlug,
    projectId,
    members: projectMemberDetails,
    user: currentUser ?? undefined,
  });

  const isEmpty = isCommentEmpty(props.initialValue);

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
        placeholder={placeholder}
        containerClassName={cn(containerClassName, "relative")}
        {...rest}
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
