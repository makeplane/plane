import React, { forwardRef, useCallback } from "react";
import debounce from "lodash/debounce";
// editor
import { CollaborativeRichTextEditorWithRef, EditorRefApi, ICollaborativeRichTextEditor } from "@plane/editor";
// types
import { IUserLite } from "@plane/types";
// plane ui
import { Loader } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { getEditorFileHandlers } from "@/helpers/editor.helper";
// hooks
import { useMember, useMention, useUser } from "@/hooks/store";
import { useIssueDescription } from "@/hooks/use-issue-description";
// plane web hooks
import { useFileSize } from "@/plane-web/hooks/use-file-size";

interface Props extends Omit<ICollaborativeRichTextEditor, "fileHandler" | "mentionHandler" | "onChange" | "value"> {
  descriptionHTML: string;
  fetchDescription: () => Promise<any>;
  projectId: string;
  updateDescription: (data: string) => Promise<any>;
  uploadFile: (file: File) => Promise<string>;
  workspaceId: string;
  workspaceSlug: string;
}

export const CollaborativeRichTextEditor = forwardRef<EditorRefApi, Props>((props, ref) => {
  const {
    containerClassName,
    descriptionHTML,
    fetchDescription,
    workspaceSlug,
    workspaceId,
    projectId,
    updateDescription,
    uploadFile,
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

  function isMutableRefObject<T>(ref: React.ForwardedRef<T>): ref is React.MutableRefObject<T | null> {
    return !!ref && typeof ref === "object" && "current" in ref;
  }
  // use issue description
  const { descriptionBinary, resolveConflictsAndUpdateDescription } = useIssueDescription({
    descriptionHTML,
    fetchDescription,
    updateDescription,
  });
  // use-mention
  const { mentionHighlights, mentionSuggestions } = useMention({
    workspaceSlug,
    projectId,
    members: projectMemberDetails,
    user: currentUser,
  });
  // file size
  const { maxFileSize } = useFileSize();

  const debouncedDescriptionSave = useCallback(
    debounce(async (updatedDescription: Uint8Array) => {
      const editorRef = isMutableRefObject<EditorRefApi>(ref) ? ref?.current : null;
      const encodedDescription = Buffer.from(updatedDescription).toString("base64");
      await resolveConflictsAndUpdateDescription(encodedDescription, editorRef);
    }, 1500),
    []
  );

  if (!descriptionBinary)
    return (
      <Loader>
        <Loader.Item height="150px" />
      </Loader>
    );

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
      onChange={debouncedDescriptionSave}
      value={descriptionBinary}
      {...rest}
      containerClassName={cn("relative pl-3 pb-3", containerClassName)}
    />
  );
});

CollaborativeRichTextEditor.displayName = "CollaborativeRichTextEditor";
