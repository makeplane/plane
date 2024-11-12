"use-client";
import { FC, useEffect } from "react";
import { observer } from "mobx-react";
// components
import { IssueParentDetail, TIssueOperations } from "@/components/issues";
// helpers
import { getTextContent } from "@/helpers/editor.helper";
// store hooks
import { useIssueDetail, useProject, useUser } from "@/hooks/store";
// hooks
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// plane web components
import { DeDupeIssuePopoverRoot } from "@/plane-web/components/de-dupe";
import { IssueTypeSwitcher } from "@/plane-web/components/issues";
// plane web hooks
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { IssueService } from "@/services/issue";
const issueService = new IssueService();
// local components
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
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
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

  // derived values
  const issue = issueId ? getIssueById(issueId) : undefined;
  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;
  // debounced duplicate issues swr
  const { duplicateIssues } = useDebouncedDuplicateIssues(projectDetails?.workspace.toString(), projectDetails?.id, {
    name: issue?.name,
    description_html: getTextContent(issue?.description_html),
    issueId: issue?.id,
  });

  if (!issue || !issue.project_id) return <></>;

  return (
    <div className="space-y-2">
      {issue.parent_id && (
        <IssueParentDetail
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issueId}
          issue={issue}
          issueOperations={issueOperations}
        />
      )}
      <div className="flex items-center justify-between gap-2">
        <IssueTypeSwitcher issueId={issueId} disabled={isArchived || disabled} />
        {duplicateIssues?.length > 0 && (
          <DeDupeIssuePopoverRoot
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            rootIssueId={issueId}
            issues={duplicateIssues}
            issueOperations={issueOperations}
          />
        )}
      </div>
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

      {issue.description_binary !== undefined && (
        <IssueDescriptionInput
          key={issue.id}
          containerClassName="-ml-3 border-none"
          descriptionBinary={issue.description_binary}
          descriptionHTML={issue.description_html ?? "<p></p>"}
          disabled={disabled}
          fetchDescription={async () => {
            if (!workspaceSlug || !issue.project_id || !issue.id) {
              throw new Error("Required fields missing while fetching binary description");
            }
            return await issueService.fetchDescriptionBinary(workspaceSlug, issue.project_id, issue.id);
          }}
          updateDescription={async (data) => {
            if (!workspaceSlug || !issue.project_id || !issue.id) {
              throw new Error("Required fields missing while updating binary description");
            }
            return await issueOperations.updateDescription(workspaceSlug, issue.project_id, issue.id, data);
          }}
          issueId={issue.id}
          projectId={issue.project_id}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          workspaceSlug={workspaceSlug}
        />
      )}

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
