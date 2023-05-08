import React, { useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// react-beautiful-dnd
import { DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
// hooks
import useIssuesProperties from "hooks/use-issue-properties";
// components
import { Tooltip } from "components/ui";
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewEstimateSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues";
// icons
import { LinkIcon, PaperClipIcon } from "@heroicons/react/24/outline";
// helper
import { truncateText } from "helpers/string.helper";
// type
import { IIssue } from "types";
// fetch-keys
import {
  CYCLE_CALENDAR_ISSUES,
  MODULE_CALENDAR_ISSUES,
  PROJECT_CALENDAR_ISSUES,
} from "constants/fetch-keys";

type Props = {
  index: number;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  issue: IIssue;
  isNotAllowed: boolean;
};

export const SingleCalendarIssue: React.FC<Props> = ({
  index,
  provided,
  snapshot,
  issue,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issueId: string) => {
      if (!workspaceSlug || !projectId) return;

      const fetchKey = cycleId
        ? CYCLE_CALENDAR_ISSUES(projectId as string, cycleId as string)
        : moduleId
        ? MODULE_CALENDAR_ISSUES(projectId as string, moduleId as string)
        : PROJECT_CALENDAR_ISSUES(projectId as string);

      mutate<IIssue[]>(
        fetchKey,
        (prevData) =>
          (prevData ?? []).map((p) => {
            if (p.id === issueId)
              return {
                ...p,
                formData,
              };
            return p;
          }),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, formData)
        .then(() => {
          mutate<IIssue[]>(fetchKey);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, cycleId, moduleId]
  );

  return (
    <div
      key={index}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`w-full cursor-pointer rounded border border-brand-base px-1.5 py-1.5 text-xs duration-300 hover:cursor-move hover:bg-brand-surface-2 ${
        snapshot.isDragging ? "bg-brand-surface-2 shadow-lg" : ""
      }`}
    >
      <div className="flex w-full flex-col items-start justify-center gap-1.5 text-xs sm:w-auto ">
        <Link href={`/${workspaceSlug}/projects/${issue?.project_detail.id}/issues/${issue.id}`}>
          <a className="flex w-full cursor-pointer flex-col items-start justify-center gap-1.5">
            {properties.key && (
              <Tooltip
                tooltipHeading="Issue ID"
                tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
              >
                <span className="flex-shrink-0 text-xs text-brand-secondary">
                  {issue.project_detail?.identifier}-{issue.sequence_id}
                </span>
              </Tooltip>
            )}
            <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
              <span className="text-xs text-brand-base">{truncateText(issue.name, 25)}</span>
            </Tooltip>
          </a>
        </Link>
        <div className="relative mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          {properties.priority && (
            <ViewPrioritySelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.state && (
            <ViewStateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              isNotAllowed={isNotAllowed}
            />
          )}

          {properties.due_date && (
            <ViewDueDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.sub_issue_count && (
            <div className="flex items-center gap-1 rounded-md border border-brand-base px-2 py-1 text-xs text-brand-secondary shadow-sm">
              {issue.sub_issues_count} {issue.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
            </div>
          )}
          {properties.labels && issue.label_details.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {issue.label_details.map((label) => (
                <span
                  key={label.id}
                  className="group flex items-center gap-1 rounded-2xl border border-brand-base px-2 py-0.5 text-xs text-brand-secondary"
                >
                  <span
                    className="h-1.5 w-1.5  rounded-full"
                    style={{
                      backgroundColor: label?.color && label.color !== "" ? label.color : "#000",
                    }}
                  />
                  {label.name}
                </span>
              ))}
            </div>
          ) : (
            ""
          )}
          {properties.assignee && (
            <ViewAssigneeSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.estimate && (
            <ViewEstimateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="left"
              isNotAllowed={isNotAllowed}
            />
          )}

          {properties.link && (
            <div className="flex cursor-default items-center rounded-md border border-brand-base px-2.5 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
                <div className="flex items-center gap-1 text-brand-secondary">
                  <LinkIcon className="h-3.5 w-3.5" />
                  {issue.link_count}
                </div>
              </Tooltip>
            </div>
          )}
          {properties.attachment_count && (
            <div className="flex cursor-default items-center rounded-md border border-brand-base px-2.5 py-1 text-xs shadow-sm">
              <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
                <div className="flex items-center gap-1 text-brand-secondary">
                  <PaperClipIcon className="h-3.5 w-3.5 -rotate-45" />
                  {issue.attachment_count}
                </div>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
