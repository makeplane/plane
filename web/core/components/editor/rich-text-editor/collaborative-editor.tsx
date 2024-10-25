import React, { forwardRef } from "react";
// editor
import { CollaborativeRichTextEditorWithRef, EditorRefApi, ICollaborativeRichTextEditor } from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMember, useMention, useUser } from "@/hooks/store";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";

interface Props extends Omit<ICollaborativeRichTextEditor, "fileHandler" | "mentionHandler"> {
  key: string;
  projectId: string;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
  workspaceSlug: string;
}

export const CollaborativeRichTextEditor = forwardRef<EditorRefApi, Props>((props, ref) => {
  const { containerClassName, workspaceSlug, workspaceId, projectId, uploadFile, ...rest } = props;
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
    user: currentUser,
  });
  // file size
  const { maxFileSize } = useFileSize();

  return (
    <CollaborativeRichTextEditorWithRef
      ref={ref}
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
      {...rest}
      containerClassName={cn("relative pl-3 pb-3", containerClassName)}
    />
  );
});

CollaborativeRichTextEditor.displayName = "CollaborativeRichTextEditor";
