"use client";

import React, { FC, useEffect, useState } from "react";
import { omit } from "lodash";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { CircularProgressIndicator } from "@plane/ui";
// components
import { IssueReaction, IssueTitleInput, IssueDescriptionInput } from "@/components/issues";
// hooks
import { useIssueDetail, useUser } from "@/hooks/store";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
import { useIssueTypes } from "@/plane-web/hooks/store";
// local components
import { EpicDetailWidgetsRoot } from "../../widgets/epic-detail-widgets";
// types
import { TIssueOperations } from "../root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  isArchived: boolean;
};

export const EpicDetailsRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, issueOperations, isEditable, isArchived } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<"submitting" | "submitted" | "saved">("saved");
  // hooks
  const { getEpicAnalyticsById } = useIssueTypes();
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  // derived values
  const issue = epicId ? getIssueById(epicId) : undefined;
  const epicAnalytics = getEpicAnalyticsById(epicId);

  const totalIssues = epicAnalytics
    ? Object.values(omit(epicAnalytics, "overdue_issues")).reduce((acc, val) => acc + val, 0)
    : 0;

  const completePercentage = epicAnalytics
    ? Math.round(((epicAnalytics.completed_issues + epicAnalytics.cancelled_issues) / totalIssues) * 100)
    : 0;

  useEffect(() => {
    if (isSubmitting === "submitted") {
      setShowAlert(false);
      setTimeout(async () => setIsSubmitting("saved"), 2000);
    } else if (isSubmitting === "submitting") setShowAlert(true);
  }, [isSubmitting, setShowAlert, setIsSubmitting]);

  if (!issue || !issue.project_id) return <></>;

  const hasSubIssues = (issue?.sub_issues_count ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex-grow">
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
        </div>
        {hasSubIssues && (
          <div className="flex-shrink-0">
            <CircularProgressIndicator
              percentage={completePercentage}
              strokeWidth={4}
              size={46}
              strokeColor="stroke-green-500"
            >
              <span className="flex items-baseline justify-center text-sm text-custom-primary-100">
                <span className="font-semibold">{completePercentage}</span>
                <span>%</span>
              </span>
            </CircularProgressIndicator>
          </div>
        )}
      </div>

      <IssueDescriptionInput
        workspaceSlug={workspaceSlug}
        projectId={issue.project_id}
        issueId={issue.id}
        initialValue={issue.description_html}
        disabled={!isEditable}
        issueOperations={issueOperations}
        setIsSubmitting={(value) => setIsSubmitting(value)}
        containerClassName="-ml-3 border-none min-h-[88px]"
      />

      <div className="flex items-center justify-between">
        {currentUser && (
          <div>
            <IssueReaction
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={epicId}
              currentUser={currentUser}
              disabled={isArchived}
            />
          </div>
        )}
        <EpicDetailWidgetsRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={isArchived || !isEditable}
        />
      </div>
    </div>
  );
});
