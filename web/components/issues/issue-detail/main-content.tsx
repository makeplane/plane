import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useIssueDetail, useProjectState, useUser } from "hooks/store";
import useReloadConfirmations from "hooks/use-reload-confirmation";
// components
import { IssueAttachmentRoot, IssueUpdateStatus } from "components/issues";
import { IssueTitleInput } from "../title-input";
import { IssueDescriptionInput } from "../description-input";
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
  if (!issue) return <></>;

  const currentIssueState = projectStates?.find((s) => s.id === issue.state_id);

  const issueDescription =
    issue.description_html !== undefined || issue.description_html !== null
      ? issue.description_html != ""
        ? issue.description_html
        : "<p></p>"
      : undefined;

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

        <IssueTitleInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          isSubmitting={isSubmitting}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          issueOperations={issueOperations}
          disabled={!is_editable}
          value={issue.name}
        />

        <IssueDescriptionInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          value={issueDescription}
          initialValue={issueDescription}
          disabled={!is_editable}
          issueOperations={issueOperations}
          setIsSubmitting={(value) => setIsSubmitting(value)}
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
