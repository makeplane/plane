import React, { useCallback, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// react-beautiful-dnd
import {
  DraggableProvided,
  DraggableStateSnapshot,
  DraggingStyle,
  NotDraggingStyle,
} from "react-beautiful-dnd";
// services
import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// components
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues/view-select";
// ui
import { CustomMenu } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import {
  CycleIssueResponse,
  IIssue,
  ModuleIssueResponse,
  NestedKeyOf,
  Properties,
  UserAuth,
} from "types";
// fetch-keys
import { CYCLE_ISSUES, MODULE_ISSUES, PROJECT_ISSUES_LIST } from "constants/fetch-keys";

type Props = {
  type?: string;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  issue: IIssue;
  selectedGroup: NestedKeyOf<IIssue> | null;
  properties: Properties;
  editIssue: () => void;
  removeIssue?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  orderBy: NestedKeyOf<IIssue> | null;
  handleTrashBox: (isDragging: boolean) => void;
  userAuth: UserAuth;
};

export const SingleBoardIssue: React.FC<Props> = ({
  type,
  provided,
  snapshot,
  issue,
  selectedGroup,
  properties,
  editIssue,
  removeIssue,
  handleDeleteIssue,
  orderBy,
  handleTrashBox,
  userAuth,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { setToastAlert } = useToast();

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

      mutate<IIssue[]>(
        PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string),
        (prevData) =>
          (prevData ?? []).map((p) => {
            if (p.id === issue.id) return { ...p, ...formData };

            return p;
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
    if (orderBy === "sort_order") return style;
    if (!snapshot.isDragging) return {};
    if (!snapshot.isDropAnimating) {
      return style;
    }

    return {
      ...style,
      transitionDuration: `0.001s`,
    };
  }

  const handleCopyText = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Issue link copied to clipboard",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Some error occurred",
        });
      });
  };

  useEffect(() => {
    if (snapshot.isDragging) handleTrashBox(snapshot.isDragging);
  }, [snapshot, handleTrashBox]);

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
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
            {type && !isNotAllowed && (
              <CustomMenu width="auto" ellipsis>
                <CustomMenu.MenuItem onClick={handleCopyText}>Copy issue link</CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={editIssue}>Edit</CustomMenu.MenuItem>
                {type !== "issue" && removeIssue && (
                  <CustomMenu.MenuItem onClick={removeIssue}>
                    <>Remove from {type}</>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem onClick={() => handleDeleteIssue(issue)}>
                  Delete permanently
                </CustomMenu.MenuItem>
              </CustomMenu>
            )}
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
          {properties.priority && selectedGroup !== "priority" && (
            <ViewPrioritySelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              isNotAllowed={isNotAllowed}
              position="left"
            />
          )}
          {properties.state && selectedGroup !== "state_detail.name" && (
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
              {issue.sub_issues_count} {issue.sub_issues_count === 1 ? "sub-issue" : "sub-issues"}
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
  );
};
