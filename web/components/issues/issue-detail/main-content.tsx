import { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail, useProjectState, useUser } from "hooks/store";
// components
import { IssueDescriptionForm, IssueAttachmentRoot, IssueUpdateStatus } from "components/issues";
import { IssueParentDetail } from "./parent";
import { IssueReaction } from "./reactions";
import { SubIssuesRoot } from "../sub-issues";
import { IssueActivity } from "./issue-activity";
// ui
import { StateGroupIcon } from "@plane/ui";
// types
import { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_editable: boolean;
};

export const IssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, is_editable } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const { currentUser } = useUser();
  const { projectStates } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const currentIssueState = projectStates?.find((s) => s.id === issue.state_id);

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
          disabled={!is_editable}
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
            parentIssueId={issueId}
            currentUser={currentUser}
            disabled={!is_editable}
          />
        )}
      </div>

      <IssueAttachmentRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={!is_editable}
      />

      <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
    </>
  );
});
