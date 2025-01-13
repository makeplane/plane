import React, { forwardRef } from "react";
// editor
import { EditorRefApi, IRichTextEditor, RichTextEditorWithRef } from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMember, useMention, useUser, useUserProfile } from "@/hooks/store";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";

interface RichTextEditorWrapperProps extends Omit<IRichTextEditor, "fileHandler" | "mentionHandler"> {
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  uploadFile: (file: File) => Promise<string>;
}

export const RichTextEditor = forwardRef<EditorRefApi, RichTextEditorWrapperProps>((props, ref) => {
  const { containerClassName, workspaceSlug, workspaceId, projectId, uploadFile, ...rest } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const {
    data: { has_enabled_smooth_cursor },
  } = useUserProfile();
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
  // file size
  const { maxFileSize } = useFileSize();

  return (
    <RichTextEditorWithRef
      ref={ref}
      fileHandler={getEditorFileHandlers({
        maxFileSize,
        projectId,
        uploadFile,
        workspaceId,
        workspaceSlug,
      })}
      has_enabled_smooth_cursor={has_enabled_smooth_cursor}
      mentionHandler={{
        highlights: mentionHighlights,
        suggestions: mentionSuggestions,
      }}
      {...rest}
      containerClassName={cn("relative pl-3", containerClassName)}
    />
  );
});

RichTextEditor.displayName = "RichTextEditor";
