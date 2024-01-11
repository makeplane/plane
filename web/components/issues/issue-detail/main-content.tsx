import { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail, useProject, useProjectState, useUser } from "hooks/store";
// components
import { IssueDescriptionForm, IssueAttachmentRoot, IssueUpdateStatus } from "components/issues";
import { IssueParentDetail } from "./parent";
import { IssueReaction } from "./reactions";
import { SubIssuesRoot } from "../sub-issues";
// ui
import { StateGroupIcon } from "@plane/ui";
// types
import { TIssueOperations } from "./root";
// constants
import { EUserProjectRoles } from "constants/project";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_archived: boolean;
  is_editable: boolean;
};

export const IssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, is_archived, is_editable } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  const { getProjectById } = useProject();
  const { projectStates } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const projectDetails = projectId ? getProjectById(projectId) : null;
  const currentIssueState = projectStates?.find((s) => s.id === issue.state_id);

  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <>
      <div className="rounded-lg space-y-4">
        {issue.parent_id && (
          <IssueParentDetail
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            issue={issue}
            issueOperations={issueOperations}
          />
        )}

        <div className="mb-2.5 flex items-center">
          {currentIssueState && (
            <StateGroupIcon
              className="mr-3 h-4 w-4"
              stateGroup={currentIssueState.group}
              color={currentIssueState.color}
            />
          )}
          <IssueUpdateStatus isSubmitting={isSubmitting} issueDetail={issue} />
        </div>

        <IssueDescriptionForm
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          isSubmitting={isSubmitting}
          issue={issue}
          issueOperations={issueOperations}
          isAllowed={isAllowed || !is_editable}
        />

        {currentUser && (
          <IssueReaction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            currentUser={currentUser}
          />
        )}

        {currentUser && (
          <SubIssuesRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            currentUser={currentUser}
            is_archived={is_archived}
            is_editable={is_editable}
          />
        )}
      </div>

      {/* issue attachments */}
      <IssueAttachmentRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        is_archived={is_archived}
        is_editable={is_editable}
      />

      {/* <div className="space-y-5 pt-3">
        <h3 className="text-lg text-custom-text-100">Comments/Activity</h3>
        <IssueActivitySection
          activity={issueActivity}
          handleCommentUpdate={handleCommentUpdate}
          handleCommentDelete={handleCommentDelete}
          showAccessSpecifier={Boolean(projectDetails && projectDetails.is_deployed)}
        />
        <AddComment
          onSubmit={handleAddComment}
          disabled={is_editable}
          showAccessSpecifier={Boolean(projectDetails && projectDetails.is_deployed)}
        />
      </div> */}
    </>
  );
});
