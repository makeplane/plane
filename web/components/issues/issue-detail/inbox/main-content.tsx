import { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useInboxIssues, useIssueDetail, useProjectState, useUser } from "hooks/store";
// components
import { IssueDescriptionForm, IssueUpdateStatus, TIssueOperations } from "components/issues";
import { IssueReaction } from "../reactions";
import { IssueActivity } from "../issue-activity";
// ui
import { StateGroupIcon } from "@plane/ui";
import { InboxIssueStatus } from "./inbox-issue-status";
// types

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_editable: boolean;
};

export const InboxIssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, is_editable } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const { currentUser } = useUser();
  const { projectStates } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const {
    issues: { getInboxIssueById },
  } = useInboxIssues();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const currentIssueState = projectStates?.find((s) => s.id === issue.state_id);

  const inboxIssueDetail = getInboxIssueById(issueId);

  return (
    <>
      <div className="rounded-lg space-y-4">
        {inboxIssueDetail && (
          <InboxIssueStatus workspaceSlug={workspaceSlug} projectId={projectId} inboxIssueDetail={inboxIssueDetail} />
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
      </div>
      <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={!is_editable} />
    </>
  );
});
