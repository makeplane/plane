import { useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail, useProjectState, useUser } from "hooks/store";
// components
import { IssueDescriptionForm, IssueUpdateStatus, TIssueOperations } from "components/issues";
import { IssueReaction } from "../reactions";
import { IssueActivity } from "../issue-activity";
import { InboxIssueStatus } from "../../../inbox/inbox-issue-status";
// ui
import { StateGroupIcon } from "@plane/ui";

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_editable: boolean;
};

export const InboxIssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, inboxId, issueId, issueOperations, is_editable } = props;
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
        <InboxIssueStatus
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          inboxId={inboxId}
          issueId={issueId}
          showDescription={true}
        />

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

      <div className="pb-12">
        <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} />
      </div>
    </>
  );
});
