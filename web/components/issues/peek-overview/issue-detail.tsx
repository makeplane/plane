import { FC } from "react";
// hooks
import { useIssueDetail, useProject, useUser } from "hooks/store";
// components
import { IssueDescriptionForm, TIssueOperations } from "components/issues";
import { IssueReaction } from "../issue-detail/reactions";

interface IPeekOverviewIssueDetails {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
}

export const PeekOverviewIssueDetails: FC<IPeekOverviewIssueDetails> = (props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled, isSubmitting, setIsSubmitting } = props;
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
      <IssueDescriptionForm
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        isSubmitting={isSubmitting}
        issue={issue}
        issueOperations={issueOperations}
        disabled={disabled}
      />
      {currentUser && (
        <IssueReaction
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          currentUser={currentUser}
        />
      )}
    </>
  );
};
