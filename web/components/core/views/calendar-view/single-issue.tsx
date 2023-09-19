import React, { useCallback } from "react";

import { useRouter } from "next/router";

import { mutate } from "swr";

// react-beautiful-dnd
import { DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
import trackEventServices from "services/track-event.service";
// hooks
import useCalendarIssuesView from "hooks/use-calendar-issues-view";
import useIssuesProperties from "hooks/use-issue-properties";
import useToast from "hooks/use-toast";
// components
import { CustomMenu, Tooltip } from "components/ui";
import { ViewDueDateSelect, ViewEstimateSelect, ViewStartDateSelect } from "components/issues";
import { LabelSelect, MembersSelect, PrioritySelect } from "components/project";
import { StateSelect } from "components/states";
// icons
import { LinkIcon, PaperClipIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// helper
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
// type
import { ICurrentUserResponse, IIssue, IState, ISubIssueResponse, TIssuePriorities } from "types";
// fetch-keys
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  SUB_ISSUES,
  VIEW_ISSUES,
} from "constants/fetch-keys";

type Props = {
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  index: number;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  issue: IIssue;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const SingleCalendarIssue: React.FC<Props> = ({
  handleEditIssue,
  handleDeleteIssue,
  index,
  provided,
  snapshot,
  issue,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { setToastAlert } = useToast();

  const { params } = useCalendarIssuesView();

  const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issue: IIssue) => {
      if (!workspaceSlug || !projectId) return;

      const fetchKey = cycleId
        ? CYCLE_ISSUES_WITH_PARAMS(cycleId.toString(), params)
        : moduleId
        ? MODULE_ISSUES_WITH_PARAMS(moduleId.toString(), params)
        : viewId
        ? VIEW_ISSUES(viewId.toString(), params)
        : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId.toString(), params);

      if (issue.parent) {
        mutate<ISubIssueResponse>(
          SUB_ISSUES(issue.parent.toString()),
          (prevData) => {
            if (!prevData) return prevData;

            return {
              ...prevData,
              sub_issues: (prevData.sub_issues ?? []).map((i) => {
                if (i.id === issue.id) {
                  return {
                    ...i,
                    ...formData,
                  };
                }
                return i;
              }),
            };
          },
          false
        );
      } else {
        mutate<IIssue[]>(
          fetchKey,
          (prevData) =>
            (prevData ?? []).map((p) => {
              if (p.id === issue.id) {
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
      }

      issuesService
        .patchIssue(
          workspaceSlug as string,
          projectId as string,
          issue.id as string,
          formData,
          user
        )
        .then(() => {
          mutate(fetchKey);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, cycleId, moduleId, viewId, params, user]
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

  const handleStateChange = (data: string, states: IState[] | undefined) => {
    const oldState = states?.find((s) => s.id === issue.state);
    const newState = states?.find((s) => s.id === data);

    partialUpdateIssue(
      {
        state: data,
        state_detail: newState,
      },
      issue
    );
    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_STATE",
      user
    );
    if (oldState?.group !== "completed" && newState?.group !== "completed") {
      trackEventServices.trackIssueMarkedAsDoneEvent(
        {
          workspaceSlug: issue.workspace_detail.slug,
          workspaceId: issue.workspace_detail.id,
          projectId: issue.project_detail.id,
          projectIdentifier: issue.project_detail.identifier,
          projectName: issue.project_detail.name,
          issueId: issue.id,
        },
        user
      );
    }
  };

  const handleAssigneeChange = (data: any) => {
    const newData = issue.assignees ?? [];

    if (newData.includes(data)) newData.splice(newData.indexOf(data), 1);
    else newData.push(data);

    partialUpdateIssue({ assignees_list: data }, issue);

    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_ASSIGNEE",
      user
    );
  };

  const handleLabelChange = (data: any) => {
    partialUpdateIssue({ labels_list: data }, issue);
  };

  const handlePriorityChange = (data: TIssuePriorities) => {
    partialUpdateIssue({ priority: data }, issue);
    trackEventServices.trackIssuePartialPropertyUpdateEvent(
      {
        workspaceSlug,
        workspaceId: issue.workspace,
        projectId: issue.project_detail.id,
        projectIdentifier: issue.project_detail.identifier,
        projectName: issue.project_detail.name,
        issueId: issue.id,
      },
      "ISSUE_PROPERTY_UPDATE_PRIORITY",
      user
    );
  };

  const displayProperties = properties
    ? Object.values(properties).some((value) => value === true)
    : false;

  const openPeekOverview = () => {
    const { query } = router;

    router.push({
      pathname: router.pathname,
      query: { ...query, peekIssue: issue.id },
    });
  };

  return (
    <div
      key={index}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`w-full relative cursor-pointer rounded border border-custom-border-200 px-1.5 py-1.5 text-xs duration-300 hover:cursor-move hover:bg-custom-background-80 ${
        snapshot.isDragging ? "bg-custom-background-80 shadow-lg" : ""
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

        <button
          type="button"
          className="flex w-full cursor-pointer flex-col items-start justify-center gap-1.5"
          onClick={openPeekOverview}
        >
          {properties.key && (
            <Tooltip
              tooltipHeading="Issue ID"
              tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
            >
              <span className="flex-shrink-0 text-xs text-custom-text-200">
                {issue.project_detail?.identifier}-{issue.sequence_id}
              </span>
            </Tooltip>
          )}
          <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
            <span className="text-xs text-custom-text-100">{truncateText(issue.name, 25)}</span>
          </Tooltip>
        </button>

        {displayProperties && (
          <div className="relative mt-1.5 w-full flex flex-wrap items-center gap-2 text-xs">
            {properties.priority && (
              <PrioritySelect
                value={issue.priority}
                onChange={handlePriorityChange}
                hideDropdownArrow
                disabled={isNotAllowed}
              />
            )}
            {properties.state && (
              <StateSelect
                value={issue.state_detail}
                onChange={handleStateChange}
                hideDropdownArrow
                disabled={isNotAllowed}
              />
            )}
            {properties.start_date && issue.start_date && (
              <ViewStartDateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                user={user}
                isNotAllowed={isNotAllowed}
              />
            )}
            {properties.due_date && issue.target_date && (
              <ViewDueDateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                user={user}
                isNotAllowed={isNotAllowed}
              />
            )}
            {properties.labels && issue.labels.length > 0 && (
              <LabelSelect
                value={issue.labels}
                onChange={handleLabelChange}
                labelsDetails={issue.label_details}
                hideDropdownArrow
                maxRender={1}
                user={user}
                disabled={isNotAllowed}
              />
            )}
            {properties.assignee && (
              <MembersSelect
                value={issue.assignees}
                onChange={handleAssigneeChange}
                membersDetails={issue.assignee_details}
                hideDropdownArrow
                disabled={isNotAllowed}
              />
            )}
            {properties.estimate && issue.estimate_point !== null && (
              <ViewEstimateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                position="left"
                user={user}
                isNotAllowed={isNotAllowed}
              />
            )}
            {properties.sub_issue_count && issue.sub_issues_count > 0 && (
              <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Sub-issue" tooltipContent={`${issue.sub_issues_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <LayerDiagonalIcon className="h-3.5 w-3.5" />
                    {issue.sub_issues_count}
                  </div>
                </Tooltip>
              </div>
            )}
            {properties.link && issue.link_count > 0 && (
              <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {issue.link_count}
                  </div>
                </Tooltip>
              </div>
            )}
            {properties.attachment_count && issue.attachment_count > 0 && (
              <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
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
