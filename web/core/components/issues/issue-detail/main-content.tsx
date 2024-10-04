"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// components
import {
  IssueActivity,
  IssueUpdateStatus,
  IssueReaction,
  IssueParentDetail,
  IssueTitleInput,
  IssueDescriptionInput,
  IssueDetailWidgets,
  PeekOverviewProperties,
} from "@/components/issues";
// hooks
import { useIssueDetail, useUser } from "@/hooks/store";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
import useSize from "@/hooks/use-window-size";
// plane web components
import { IssueTypeSwitcher } from "@/plane-web/components/issues";
// types
import { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  isArchived: boolean;
};

export const IssueMainContent: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable, isArchived } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const windowSize = useSize();
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => setIsSubmitting("saved"), 2000);
    } else if (isSubmitting === "submitting") setShowAlert(true);
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  const issue = issueId ? getIssueById(issueId) : undefined;
  if (!issue || !issue.project_id) return <></>;

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

        <div className="mb-2.5 flex items-center justify-between gap-4">
          <IssueTypeSwitcher issueId={issueId} disabled={isArchived || !isEditable} />
          <IssueUpdateStatus isSubmitting={isSubmitting} />
        </div>

        <IssueTitleInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          isSubmitting={isSubmitting}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          issueOperations={issueOperations}
          disabled={!isEditable}
          value={issue.name}
          containerClassName="-ml-3"
        />

        {/* {issue?.description_html === issueDescription && ( */}
        <IssueDescriptionInput
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          issueId={issue.id}
          initialValue={issue.description_html}
          disabled={!isEditable}
          issueOperations={issueOperations}
          setIsSubmitting={(value) => setIsSubmitting(value)}
          containerClassName="-ml-3 border-none"
        />
        {/* )} */}

        {currentUser && (
          <IssueReaction
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            currentUser={currentUser}
            disabled={isArchived}
          />
        )}
      </div>

      <IssueDetailWidgets
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        disabled={!isEditable || isArchived}
      />

      {windowSize[0] < 768 && (
        <PeekOverviewProperties
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issueOperations={issueOperations}
          disabled={!isEditable || isArchived}
        />
      )}

      <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={isArchived} />
    </>
  );
});
