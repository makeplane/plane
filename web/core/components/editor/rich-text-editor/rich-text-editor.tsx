import React, { forwardRef } from "react";
// editor
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef } from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMember, useMention, useUser } from "@/hooks/store";
// services
import { FileService } from "@/services/file.service";

interface RichTextEditorWrapperProps extends Omit<IRichTextEditor, "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
}

const fileService = new FileService();

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { containerClassName, workspaceSlug, workspaceId, projectId, ...rest } = props;
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
      containerClassName={cn("relative pl-3 pb-3", containerClassName)}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
