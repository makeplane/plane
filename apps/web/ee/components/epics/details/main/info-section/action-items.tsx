"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EditorRefApi } from "@plane/editor";
import { EIssueServiceType } from "@plane/types";
// components
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
import { IssueReaction } from "@/components/issues/issue-detail/reactions";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail"
import { useMember } from "@/hooks/store/use-member"
import { useUser } from "@/hooks/store/user";
// services
import { WorkItemVersionService } from "@/services/issue";
const workItemVersionService = new WorkItemVersionService(EIssueServiceType.EPICS);

type TEpicInfoActionItemsProps = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
};

export const EpicInfoActionItems: FC<TEpicInfoActionItemsProps> = observer((props) => {
  const { editorRef, workspaceSlug, projectId, epicId, disabled } = props;
  // store hooks
  const { data: currentUser } = useUser();
  const { getUserDetails } = useMember();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  // derived values
  const epic = getIssueById(epicId);

  if (!epic || !epic.project_id) return null;

  return (
    <div className="flex-shrink-0 w-full flex items-center justify-between gap-2">
      {currentUser && (
        <IssueReaction
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={epicId}
          currentUser={currentUser}
          disabled={disabled}
          className="m-0"
        />
      )}
      {!disabled && (
        <DescriptionVersionsRoot
          className="flex-shrink-0"
          entityInformation={{
            createdAt: epic.created_at ? new Date(epic.created_at) : new Date(),
            createdByDisplayName: getUserDetails(epic.created_by)?.display_name ?? "",
            id: epicId,
            isRestoreDisabled: disabled,
          }}
          fetchHandlers={{
            listDescriptionVersions: (epicId) =>
              workItemVersionService.listDescriptionVersions(workspaceSlug, epic.project_id?.toString() ?? "", epicId),
            retrieveDescriptionVersion: (epicId, versionId) =>
              workItemVersionService.retrieveDescriptionVersion(
                workspaceSlug,
                epic.project_id?.toString() ?? "",
                epicId,
                versionId
              ),
          }}
          handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
          projectId={epic.project_id}
          workspaceSlug={workspaceSlug}
        />
      )}
    </div>
  );
});
