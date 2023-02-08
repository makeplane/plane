import React, { useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-beautiful-dnd
import {
  Draggable,
  DraggableStateSnapshot,
  DraggingStyle,
  NotDraggingStyle,
} from "react-beautiful-dnd";
// constants
import { TrashIcon } from "@heroicons/react/24/outline";
// services
import issuesService from "services/issues.service";
// components
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues/view-select";
// types
import {
  CycleIssueResponse,
  IIssue,
  IssueResponse,
  ModuleIssueResponse,
  NestedKeyOf,
  Properties,
  UserAuth,
} from "types";
// fetch-keys
import { CYCLE_ISSUES, MODULE_ISSUES, PROJECT_ISSUES_LIST } from "constants/fetch-keys";

type Props = {
  index: number;
  type?: string;
  issue: IIssue;
  selectedGroup: NestedKeyOf<IIssue> | null;
  properties: Properties;
  handleDeleteIssue: (issue: IIssue) => void;
  orderBy: NestedKeyOf<IIssue> | "manual" | null;
  userAuth: UserAuth;
};

export const SingleBoardIssue: React.FC<Props> = ({
  index,
  type,
  issue,
  selectedGroup,
  properties,
  handleDeleteIssue,
  orderBy,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId) return;

      if (cycleId)
        mutate<CycleIssueResponse[]>(
          CYCLE_ISSUES(cycleId as string),
          (prevData) => {
            const updatedIssues = (prevData ?? []).map((p) => {
              if (p.issue_detail.id === issue.id) {
                return {
                  ...p,
                  issue_detail: {
                    ...p.issue_detail,
                    ...formData,
                  },
                };
              }
              return p;
            });
            return [...updatedIssues];
          },
          false
        );

      if (moduleId)
        mutate<ModuleIssueResponse[]>(
          MODULE_ISSUES(moduleId as string),
          (prevData) => {
            const updatedIssues = (prevData ?? []).map((p) => {
              if (p.issue_detail.id === issue.id) {
                return {
                  ...p,
                  issue_detail: {
                    ...p.issue_detail,
                    ...formData,
                  },
                };
              }
              return p;
            });
            return [...updatedIssues];
          },
          false
        );

      mutate<IssueResponse>(
        PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
        (prevData) => ({
          ...(prevData as IssueResponse),
          results: (prevData?.results ?? []).map((p) => {
            if (p.id === issue.id) return { ...p, ...formData };
            return p;
          }),
        }),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issue.id, formData)
        .then((res) => {
          if (cycleId) mutate(CYCLE_ISSUES(cycleId as string));
          if (moduleId) mutate(MODULE_ISSUES(moduleId as string));

          mutate(PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string));
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [workspaceSlug, projectId, cycleId, moduleId, issue]
  );

  function getStyle(
    style: DraggingStyle | NotDraggingStyle | undefined,
    snapshot: DraggableStateSnapshot
  ) {
    if (orderBy === "manual") return style;
    if (!snapshot.isDragging) return {};
    if (!snapshot.isDropAnimating) {
      return style;
    }

    return {
      ...style,
      transitionDuration: `0.001s`,
    };
  }

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <Draggable
      key={issue.id}
      draggableId={issue.id}
      index={index}
      isDragDisabled={selectedGroup === "created_by"}
    >
      {(provided, snapshot) => (
        <div
          className={`rounded border bg-white shadow-sm ${
            snapshot.isDragging ? "border-theme bg-indigo-50 shadow-lg" : ""
          }`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getStyle(provided.draggableProps.style, snapshot)}
        >
          <div className="group/card relative select-none p-2">
            {!isNotAllowed && (
              <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover/card:opacity-100">
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded bg-white p-1 text-red-500 outline-none duration-300 hover:bg-red-50"
                  onClick={() => handleDeleteIssue(issue)}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
            <Link href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}>
              <a>
                {properties.key && (
                  <div className="mb-2 text-xs font-medium text-gray-500">
                    {issue.project_detail.identifier}-{issue.sequence_id}
                  </div>
                )}
                <h5
                  className="mb-3 text-sm group-hover:text-theme"
                  style={{ lineClamp: 3, WebkitLineClamp: 3 }}
                >
                  {issue.name}
                </h5>
              </a>
            </Link>
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
              {properties.priority && (
                <ViewPrioritySelect
                  issue={issue}
                  partialUpdateIssue={partialUpdateIssue}
                  isNotAllowed={isNotAllowed}
                  position="left"
                />
              )}
              {properties.state && (
                <ViewStateSelect
                  issue={issue}
                  partialUpdateIssue={partialUpdateIssue}
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
                <div className="flex flex-shrink-0 items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {issue.sub_issues_count}{" "}
                  {issue.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
                </div>
              )}
              {properties.assignee && (
                <ViewAssigneeSelect
                  issue={issue}
                  partialUpdateIssue={partialUpdateIssue}
                  isNotAllowed={isNotAllowed}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
