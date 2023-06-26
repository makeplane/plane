import React, { useCallback } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// components
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewEstimateSelect,
  ViewLabelSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues";
// icons
import { CustomMenu, Icon } from "components/ui";
import { LinkIcon, PencilIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
// hooks
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
import useToast from "hooks/use-toast";
// services
import issuesService from "services/issues.service";
// constant
import {
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  SUB_ISSUES,
  VIEW_ISSUES,
} from "constants/fetch-keys";
// types
import { ICurrentUserResponse, IIssue, ISubIssueResponse, Properties, UserAuth } from "types";
// helper
import { copyTextToClipboard } from "helpers/string.helper";

type Props = {
  issue: IIssue;
  expanded: boolean;
  handleToggleExpand: (issueId: string) => void;
  properties: Properties;
  handleEditIssue: (issue: IIssue) => void;
  handleDeleteIssue: (issue: IIssue) => void;
  gridTemplateColumns: string;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  nestingLevel: number;
};

export const SingleSpreadsheetIssue: React.FC<Props> = ({
  issue,
  expanded,
  handleToggleExpand,
  properties,
  handleEditIssue,
  handleDeleteIssue,
  gridTemplateColumns,
  user,
  userAuth,
  nestingLevel,
}) => {
  const router = useRouter();

  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

  const { params } = useSpreadsheetIssuesView();

  const { setToastAlert } = useToast();

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
          if (issue.parent) {
            mutate(SUB_ISSUES(issue.parent as string));
          } else {
            mutate(fetchKey);
          }
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

  const paddingLeft = `${nestingLevel * 68}px`;

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <div
      className="relative group grid auto-rows-[minmax(44px,1fr)] hover:rounded-sm hover:bg-brand-surface-2 border-b border-brand-base w-full min-w-max"
      style={{ gridTemplateColumns }}
    >
      <div className="flex gap-1.5 items-center px-4 sticky left-0 z-[1] text-brand-secondary bg-brand-base group-hover:text-brand-base group-hover:bg-brand-surface-2 border-brand-base w-full">
        <span className="flex gap-1 items-center" style={issue.parent ? { paddingLeft } : {}}>
          <div className="flex items-center cursor-pointer text-xs text-center hover:text-brand-base w-14  opacity-100 group-hover:opacity-0">
            {properties.key && (
              <span>
                {issue.project_detail?.identifier}-{issue.sequence_id}
              </span>
            )}
          </div>

          <div className="h-5 w-5">
            {issue.sub_issues_count > 0 && (
              <button
                className="h-5 w-5 hover:bg-brand-surface-1 hover:text-brand-base rounded-sm"
                onClick={() => handleToggleExpand(issue.id)}
              >
                <Icon iconName="chevron_right" className={`${expanded ? "rotate-90" : ""}`} />
              </button>
            )}
          </div>
        </span>
        <Link href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}>
          <a className="truncate text-brand-base cursor-pointer w-full text-[0.825rem]">
            {issue.name}
          </a>
        </Link>
      </div>
      {properties.state && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
          <ViewStateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="left"
            customButton
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.priority && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
          <ViewPrioritySelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="left"
            noBorder
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.assignee && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
          <ViewAssigneeSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="left"
            customButton
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.labels && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
          <ViewLabelSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="left"
            customButton
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}

      {properties.due_date && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
          <ViewDueDateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            noBorder
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      {properties.estimate && (
        <div className="flex items-center text-xs text-brand-secondary text-center p-2 group-hover:bg-brand-surface-2 border-brand-base">
          <ViewEstimateSelect
            issue={issue}
            partialUpdateIssue={partialUpdateIssue}
            position="left"
            user={user}
            isNotAllowed={isNotAllowed}
          />
        </div>
      )}
      <div
        className="absolute top-2.5 z-10 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: `${nestingLevel * 68 + 24}px`,
        }}
      >
        {!isNotAllowed && (
          <CustomMenu width="auto" position="left" ellipsis>
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
                <span>Copy issue link</span>
              </div>
            </CustomMenu.MenuItem>
          </CustomMenu>
        )}
      </div>
    </div>
  );
};
