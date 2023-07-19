import React, { useCallback, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// services
import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// components
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewEstimateSelect,
  ViewLabelSelect,
  ViewPrioritySelect,
  ViewStateSelect,
} from "components/issues/view-select";
// hooks
import useIssueView from "hooks/use-issues-view";
// ui
import { Tooltip, CustomMenu, ContextMenu } from "components/ui";
// icons
import {
  ClipboardDocumentCheckIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// helpers
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { handleIssuesMutation } from "constants/issue";
// types
import { ICurrentUserResponse, IIssue, ISubIssueResponse, Properties, UserAuth } from "types";
// fetch-keys
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
  SUB_ISSUES,
  VIEW_ISSUES,
} from "constants/fetch-keys";

type Props = {
  type?: string;
  issue: IIssue;
  properties: Properties;
  groupTitle?: string;
  editIssue: () => void;
  index: number;
  makeIssueCopy: () => void;
  removeIssue?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  isCompleted?: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
};

export const SingleListIssue: React.FC<Props> = ({
  type,
  issue,
  properties,
  editIssue,
  index,
  makeIssueCopy,
  removeIssue,
  groupTitle,
  handleDeleteIssue,
  isCompleted = false,
  user,
  userAuth,
}) => {
  // context menu
  const [contextMenu, setContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;
  const isArchivedIssues = router.pathname.includes("archived-issues");

  const { setToastAlert } = useToast();

  const { groupByProperty: selectedGroup, orderBy, params } = useIssueView();

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
        mutate<
          | {
              [key: string]: IIssue[];
            }
          | IIssue[]
        >(
          fetchKey,
          (prevData) =>
            handleIssuesMutation(
              formData,
              groupTitle ?? "",
              selectedGroup,
              index,
              orderBy,
              prevData
            ),
          false
        );
      }

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issue.id, formData, user)
        .then(() => {
          mutate(fetchKey);

          if (cycleId) mutate(CYCLE_DETAILS(cycleId as string));
          if (moduleId) mutate(MODULE_DETAILS(moduleId as string));
        });
    },
    [
      workspaceSlug,
      projectId,
      cycleId,
      moduleId,
      viewId,
      groupTitle,
      index,
      selectedGroup,
      orderBy,
      params,
      user,
    ]
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

  const singleIssuePath = isArchivedIssues
    ? `/${workspaceSlug}/projects/${projectId}/archived-issues/${issue.id}`
    : `/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`;

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || isCompleted || isArchivedIssues;

  return (
    <>
      <ContextMenu
        position={contextMenuPosition}
        title="Quick actions"
        isOpen={contextMenu}
        setIsOpen={setContextMenu}
      >
        {!isNotAllowed && (
          <>
            <ContextMenu.Item Icon={PencilIcon} onClick={editIssue}>
              Edit issue
            </ContextMenu.Item>
            <ContextMenu.Item Icon={ClipboardDocumentCheckIcon} onClick={makeIssueCopy}>
              Make a copy...
            </ContextMenu.Item>
            <ContextMenu.Item Icon={TrashIcon} onClick={() => handleDeleteIssue(issue)}>
              Delete issue
            </ContextMenu.Item>
          </>
        )}
        <ContextMenu.Item Icon={LinkIcon} onClick={handleCopyText}>
          Copy issue link
        </ContextMenu.Item>
        <a href={singleIssuePath} target="_blank" rel="noreferrer noopener">
          <ContextMenu.Item Icon={ArrowTopRightOnSquareIcon}>
            Open issue in new tab
          </ContextMenu.Item>
        </a>
      </ContextMenu>
      <div
        className="flex flex-wrap items-center justify-between px-4 py-2.5 gap-2 border-b border-custom-border-200 bg-custom-background-100 last:border-b-0"
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(true);
          setContextMenuPosition({ x: e.pageX, y: e.pageY });
        }}
      >
        <Link href={singleIssuePath}>
          <div className="flex-grow cursor-pointer">
            <a className="group relative flex items-center gap-2">
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
                <span className="text-[0.825rem] text-custom-text-100">
                  {truncateText(issue.name, 50)}
                </span>
              </Tooltip>
            </a>
          </div>
        </Link>

        <div
          className={`flex w-full flex-shrink flex-wrap items-center gap-2 text-xs sm:w-auto ${
            isArchivedIssues ? "opacity-60" : ""
          }`}
        >
          {properties.priority && (
            <ViewPrioritySelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="right"
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.state && (
            <ViewStateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="right"
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
            <ViewLabelSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="right"
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.assignee && (
            <ViewAssigneeSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="right"
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.estimate && issue.estimate_point !== null && (
            <ViewEstimateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="right"
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
          {type && !isNotAllowed && (
            <CustomMenu width="auto" ellipsis>
              <CustomMenu.MenuItem onClick={editIssue}>
                <div className="flex items-center justify-start gap-2">
                  <PencilIcon className="h-4 w-4" />
                  <span>Edit issue</span>
                </div>
              </CustomMenu.MenuItem>
              {type !== "issue" && removeIssue && (
                <CustomMenu.MenuItem onClick={removeIssue}>
                  <div className="flex items-center justify-start gap-2">
                    <XMarkIcon className="h-4 w-4" />
                    <span>Remove from {type}</span>
                  </div>
                </CustomMenu.MenuItem>
              )}
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
    </>
  );
};
