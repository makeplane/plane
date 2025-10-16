"use-client";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TNameDescriptionLoader } from "@plane/types";
// components
import { getTextContent } from "@plane/utils";
import { DescriptionVersionsRoot } from "@/components/core/description-versions";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// plane web components
import { DeDupeIssuePopoverRoot } from "@/plane-web/components/de-dupe/duplicate-popover";
import { IssueTypeSwitcher } from "@/plane-web/components/issues/issue-details/issue-type-switcher";
// plane web hooks
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
// services
import { WorkItemVersionService } from "@/services/issue";
// local components
import { IssueDescriptionInput } from "../description-input";
import type { TIssueOperations } from "../issue-detail";
import { IssueParentDetail } from "../issue-detail/parent";
import { IssueReaction } from "../issue-detail/reactions";
import { IssueTitleInput } from "../title-input";
// services init
const workItemVersionService = new WorkItemVersionService();

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
  isArchived: boolean;
  isSubmitting: TNameDescriptionLoader;
  setIsSubmitting: (value: TNameDescriptionLoader) => void;
};

export const PeekOverviewIssueDetails: FC<Props> = observer((props) => {
  const { editorRef, workspaceSlug, issueId, issueOperations, disabled, isArchived, isSubmitting, setIsSubmitting } =
    props;
  // store hooks
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  // reload confirmation
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
  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug,
    projectDetails?.workspace.toString(),
    projectDetails?.id,
    {
      name: issue?.name,
      description_html: getTextContent(issue?.description_html),
      issueId: issue?.id,
    }
  );

  if (!issue || !issue.project_id) return <></>;

  const issueDescription =
    issue.description_html !== undefined || issue.description_html !== null
      ? issue.description_html != ""
        ? issue.description_html
        : "<p></p>"
      : undefined;

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
        disabled={disabled || isArchived}
        value={issue.name}
        containerClassName="-ml-3"
      />

      <IssueDescriptionInput
        editorRef={editorRef}
        workspaceSlug={workspaceSlug}
        projectId={issue.project_id}
        issueId={issue.id}
        initialValue={issueDescription}
        disabled={disabled || isArchived}
        issueOperations={issueOperations}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        containerClassName="-ml-3 border-none"
      />

      <div className="flex items-center justify-between gap-2">
        {currentUser && (
          <IssueReaction
            workspaceSlug={workspaceSlug}
            projectId={issue.project_id}
            issueId={issueId}
            currentUser={currentUser}
            disabled={isArchived}
          />
        )}
        {!disabled && (
          <DescriptionVersionsRoot
            className="flex-shrink-0"
            entityInformation={{
              createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
              createdByDisplayName: getUserDetails(issue.created_by ?? "")?.display_name ?? "",
              id: issueId,
              isRestoreDisabled: disabled || isArchived,
            }}
            fetchHandlers={{
              listDescriptionVersions: (issueId) =>
                workItemVersionService.listDescriptionVersions(
                  workspaceSlug,
                  issue.project_id?.toString() ?? "",
                  issueId
                ),
              retrieveDescriptionVersion: (issueId, versionId) =>
                workItemVersionService.retrieveDescriptionVersion(
                  workspaceSlug,
                  issue.project_id?.toString() ?? "",
                  issueId,
                  versionId
                ),
            }}
            handleRestore={(descriptionHTML) => editorRef.current?.setEditorValue(descriptionHTML, true)}
            projectId={issue.project_id}
            workspaceSlug={workspaceSlug}
          />
        )}
      </div>
    </div>
  );
});
