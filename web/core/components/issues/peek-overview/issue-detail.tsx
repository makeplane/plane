import { FC, useEffect } from "react";
import { observer } from "mobx-react";
// store hooks
import { TIssueOperations } from "@/components/issues";
import { useIssueDetail, useProject, useUser } from "@/hooks/store";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// components
import { IssueDescriptionInput } from "../description-input";
import { IssueReaction } from "../issue-detail/reactions";
import { IssueTitleInput } from "../title-input";

interface IPeekOverviewIssueDetails {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
  isArchived: boolean;
  isSubmitting: "submitting" | "submitted" | "saved";
  setIsSubmitting: (value: "submitting" | "submitted" | "saved") => void;
}

export const PeekOverviewIssueDetails: FC<IPeekOverviewIssueDetails> = observer((props) => {
  const { workspaceSlug, issueId, issueOperations, disabled, isArchived, isSubmitting, setIsSubmitting } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // hooks
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => {
        setIsSubmitting("saved");
      }, 2000);
    } else if (isSubmitting === "submitting") {
      setShowAlert(true);
    }
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  const issue = issueId ? getIssueById(issueId) : undefined;
  if (!issue || !issue.project_id) return <></>;

  const projectDetails = getProjectById(issue.project_id);

  const issueDescription =
    issue.description_html !== undefined || issue.description_html !== null
      ? issue.description_html != ""
        ? issue.description_html
        : "<p></p>"
      : undefined;

  return (
    <div className="space-y-2">
      <span className="text-base font-medium text-custom-text-400">
        {projectDetails?.identifier}-{issue?.sequence_id}
      </span>
      <IssueTitleInput
        workspaceSlug={workspaceSlug}
        projectId={issue.project_id}
        issueId={issue.id}
        isSubmitting={isSubmitting}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        issueOperations={issueOperations}
        disabled={disabled}
        value={issue.name}
        containerClassName="-ml-3"
      />

      <IssueDescriptionInput
        workspaceSlug={workspaceSlug}
        projectId={issue.project_id}
        issueId={issue.id}
        initialValue={issueDescription}
        // for now peek overview doesn't have live syncing while tab changes
        swrIssueDescription={issueDescription}
        disabled={disabled}
        issueOperations={issueOperations}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        containerClassName="-ml-3 !mb-6 border-none"
      />

      {currentUser && (
        <IssueReaction
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issueId}
          currentUser={currentUser}
          disabled={isArchived}
        />
      )}
    </div>
  );
});
