import React, { useState } from "react";
// editor
import { EIssueCommentAccessSpecifier } from "@plane/constants";
import { EditorRefApi, ILiteTextEditor, LiteTextEditorWithRef } from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// components
import { IssueCommentToolbar } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
import { isCommentEmpty } from "@/helpers/string.helper";
// hooks
import { useMember, useMention, useUser } from "@/hooks/store";
// plane web hooks
import { useEditorFlagging } from "@/plane-web/hooks/use-editor-flagging";
import { useFileSize } from "@/plane-web/hooks/use-file-size";

interface LiteTextEditorWrapperProps
  extends Omit<ILiteTextEditor, "disabledExtensions" | "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  accessSpecifier?: EIssueCommentAccessSpecifier;
  handleAccessChange?: (accessKey: EIssueCommentAccessSpecifier) => void;
  showAccessSpecifier?: boolean;
  showSubmitButton?: boolean;
  isSubmitting?: boolean;
  showToolbarInitially?: boolean;
  uploadFile: (file: File) => Promise<string>;
}

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
    showToolbarInitially = true,
    placeholder = "Add comment...",
    uploadFile,
    ...rest
  } = props;
  // states
  const [isFocused, setIsFocused] = useState(showToolbarInitially);
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    project: { getProjectMemberIds },
  } = useMember();
  // editor flaggings
  const { liteTextEditor: disabledExtensions } = useEditorFlagging(workspaceSlug?.toString());
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
  // file size
  const { maxFileSize } = useFileSize();
  function isMutableRefObject<T>(ref: React.ForwardedRef<T>): ref is React.MutableRefObject<T | null> {
    return !!ref && typeof ref === "object" && "current" in ref;
  }
  // derived values
  const isEmpty = isCommentEmpty(props.initialValue);
  const editorRef = isMutableRefObject<EditorRefApi>(ref) ? ref.current : null;

  return (
    <div
      className={cn("relative border border-custom-border-200 rounded p-3")}
      onFocus={() => !showToolbarInitially && setIsFocused(true)}
      onBlur={() => !showToolbarInitially && setIsFocused(false)}
    >
      <LiteTextEditorWithRef
        ref={ref}
        disabledExtensions={disabledExtensions}
        fileHandler={getEditorFileHandlers({
          maxFileSize,
          projectId,
          uploadFile,
          workspaceId,
          workspaceSlug,
        })}
        mentionHandler={{
          highlights: mentionHighlights,
          suggestions: mentionSuggestions,
        }}
        placeholder={placeholder}
        containerClassName={cn(containerClassName, "relative")}
        {...rest}
      />
      <div
        className={cn(
          "transition-all duration-300 ease-out origin-top overflow-hidden",
          isFocused ? "max-h-[200px] opacity-100 scale-y-100 mt-3" : "max-h-0 opacity-0 scale-y-0 invisible"
        )}
      >
        <IssueCommentToolbar
          accessSpecifier={accessSpecifier}
          executeCommand={(item) => {
            // TODO: update this while toolbar homogenization
            // @ts-expect-error type mismatch here
            editorRef?.executeMenuItemCommand({
              itemKey: item.itemKey,
              ...item.extraProps,
            });
          }}
          handleAccessChange={handleAccessChange}
          handleSubmit={(e) => rest.onEnterKeyPress?.(e)}
          isCommentEmpty={isEmpty}
          isSubmitting={isSubmitting}
          showAccessSpecifier={showAccessSpecifier}
          editorRef={editorRef}
          showSubmitButton={showSubmitButton}
        />
      </div>
    </div>
  );
});

LiteTextEditor.displayName = "LiteTextEditor";
