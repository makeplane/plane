import React, { useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// react-beautiful-dnd
import { DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
// hooks
import useCalendarIssuesView from "hooks/use-calendar-issues-view";
import useIssuesProperties from "hooks/use-issue-properties";
import useToast from "hooks/use-toast";
// components
import { CustomMenu, Tooltip } from "components/ui";
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewEstimateSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues";
// icons
import { LinkIcon, PaperClipIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// helper
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// type
import { IIssue } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  VIEW_ISSUES,
} from "constants/fetch-keys";

type Props = {
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  index: number;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  issue: IIssue;
  isNotAllowed: boolean;
};

export const SingleCalendarIssue: React.FC<Props> = ({
  handleEditIssue,
  handleDeleteIssue,
  index,
  provided,
  snapshot,
  issue,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { setToastAlert } = useToast();

  const { params } = useCalendarIssuesView();

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issueId: string) => {
      if (!workspaceSlug || !projectId) return;

      const fetchKey = cycleId
        ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
        : moduleId
        ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
        : viewId
        ? VIEW_ISSUES(viewId.toString(), params)
        : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params);

      mutate<IIssue[]>(
        fetchKey,
        (prevData) =>
          (prevData ?? []).map((p) => {
            if (p.id === issueId) {
              return {
                ...p,
                ...formData,
                assignees: formData?.assignees_list ?? p.assignees,
              };
            }

            return p;
          }),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId as string, formData)
        .then(() => {
          mutate(fetchKey);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, cycleId, moduleId, params]
  );

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const displayProperties = properties
    ? Object.values(properties).some((value) => value === true)
    : false;

  return (
    <div
      key={index}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`w-full relative cursor-pointer rounded border border-brand-base px-1.5 py-1.5 text-xs duration-300 hover:cursor-move hover:bg-brand-surface-2 ${
        snapshot.isDragging ? "bg-brand-surface-2 shadow-lg" : ""
      }`}
    >
      <div className="group/card flex w-full flex-col items-start justify-center gap-1.5 text-xs sm:w-auto ">
        {!isNotAllowed && (
          <div className="z-1 absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100">
            <CustomMenu width="auto" ellipsis>
              <CustomMenu.MenuItem onClick={() => handleEditIssue(issue)}>
                <div className="flex items-center justify-start gap-2">
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit issue</span>
                </div>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => handleDeleteIssue(issue)}>
                <div className="flex items-center justify-start gap-2">
                  <TrashIcon className="h-4 w-4" />
                  <span>Delete issue</span>
                </div>
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={handleCopyText}>
                <div className="flex items-center justify-start gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>Copy issue Link</span>
                </div>
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
        )}
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
        {displayProperties && (
          <div className="relative mt-1.5 flex flex-wrap items-center gap-2 text-xs">
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
            {properties.labels && issue.label_details.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {issue.label_details.map((label) => (
                  <span
                    key={label.id}
                    className="group flex items-center gap-1 rounded-2xl border border-brand-base px-2 py-0.5 text-xs text-brand-secondary"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
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
            {properties.sub_issue_count && (
              <div className="flex cursor-default items-center rounded-md border border-brand-base px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Sub-issue" tooltipContent={`${issue.sub_issues_count}`}>
                  <div className="flex items-center gap-1 text-brand-secondary">
                    <LayerDiagonalIcon className="h-3.5 w-3.5" />
                    {issue.sub_issues_count}
                  </div>
                </Tooltip>
              </div>
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
        )}
      </div>
    </div>
  );
};
