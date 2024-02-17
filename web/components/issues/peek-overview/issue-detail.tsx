import { FC, useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// store hooks
import { useIssueDetail, useProject, useUser } from "hooks/store";
// hooks
import useReloadConfirmations from "hooks/use-reload-confirmation";
// components
import { TIssueOperations } from "components/issues";
import { IssueReaction } from "../issue-detail/reactions";
import { IssueTitleInput } from "../title-input";
import { IssueDescriptionInput } from "../description-input";
import { debounce } from "lodash";

interface IPeekOverviewIssueDetails {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
}

export const PeekOverviewIssueDetails: FC<IPeekOverviewIssueDetails> = observer((props) => {
  const { workspaceSlug, issueId, issueOperations, disabled, setIsSubmitting } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // derived values
  const issue = getIssueById(issueId);

  if (!issue) return <></>;

  const projectDetails = getProjectById(issue?.project_id);

  return (
    <>
      <span className="text-base font-medium text-custom-text-400">
        {projectDetails?.identifier}-{issue?.sequence_id}
      </span>
      <IssueTitleInput
        workspaceSlug={workspaceSlug}
        projectId={issue.project_id}
        issueId={issue.id}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        issueOperations={issueOperations}
        disabled={disabled}
        value={issue.name}
      />
      <IssueDescriptionInput
        workspaceSlug={workspaceSlug}
        projectId={issue.project_id}
        issueId={issue.id}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        issueOperations={issueOperations}
        disabled={disabled}
        value={issue.description_html}
      />
      {currentUser && (
        <IssueReaction
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issueId}
          currentUser={currentUser}
        />
      )}
    </>
  );
});
