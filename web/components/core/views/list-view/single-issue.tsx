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
  ViewIssueLabel,
  ViewPrioritySelect,
  ViewStartDateSelect,
  ViewStateSelect,
} from "components/issues";
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
import { copyTextToClipboard } from "helpers/string.helper";
import { handleIssuesMutation } from "constants/issue";
// types
import {
  ICurrentUserResponse,
  IIssue,
  IIssueViewProps,
  ISubIssueResponse,
  IUserProfileProjectSegregation,
  UserAuth,
} from "types";
// fetch-keys
import {
  CYCLE_DETAILS,
  MODULE_DETAILS,
  SUB_ISSUES,
  USER_PROFILE_PROJECT_SEGREGATION,
} from "constants/fetch-keys";

type Props = {
  type?: string;
  issue: IIssue;
  groupTitle?: string;
  editIssue: () => void;
  index: number;
  makeIssueCopy: () => void;
  removeIssue?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const SingleListIssue: React.FC<Props> = ({
  type,
  issue,
  editIssue,
  index,
  makeIssueCopy,
  removeIssue,
  groupTitle,
  handleDeleteIssue,
  disableUserActions,
  user,
  userAuth,
  viewProps,
}) => {
  // context menu
  const [contextMenu, setContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<React.MouseEvent | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId, userId } = router.query;
  const isArchivedIssues = router.pathname.includes("archived-issues");

  const { setToastAlert } = useToast();

  const { groupByProperty: selectedGroup, orderBy, properties, mutateIssues } = viewProps;

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issue: IIssue) => {
      if (!workspaceSlug || !issue) return;

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
        mutateIssues(
          (prevData: any) =>
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
        .patchIssue(workspaceSlug as string, issue.project, issue.id, formData, user)
        .then(() => {
          mutateIssues();

          if (userId)
            mutate<IUserProfileProjectSegregation>(
              USER_PROFILE_PROJECT_SEGREGATION(workspaceSlug.toString(), userId.toString())
            );

          if (cycleId) mutate(CYCLE_DETAILS(cycleId as string));
          if (moduleId) mutate(MODULE_DETAILS(moduleId as string));
        });
    },
    [
      workspaceSlug,
      cycleId,
      moduleId,
      userId,
      groupTitle,
      index,
      selectedGroup,
      mutateIssues,
      orderBy,
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

  const issuePath = isArchivedIssues
    ? `/${workspaceSlug}/projects/${issue.project}/archived-issues/${issue.id}`
    : `/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`;

  const isNotAllowed =
    userAuth.isGuest || userAuth.isViewer || disableUserActions || isArchivedIssues;

  return (
    <>
      <ContextMenu
        clickEvent={contextMenuPosition}
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
        <a href={issuePath} target="_blank" rel="noreferrer noopener">
          <ContextMenu.Item Icon={ArrowTopRightOnSquareIcon}>
            Open issue in new tab
          </ContextMenu.Item>
        </a>
      </ContextMenu>
      <div
        className="flex items-center justify-between px-4 py-2.5 gap-10 border-b border-custom-border-200 bg-custom-background-100 last:border-b-0"
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(true);
          setContextMenuPosition(e);
        }}
      >
        <div className="flex-grow cursor-pointer min-w-[200px] whitespace-nowrap overflow-hidden overflow-ellipsis">
          <Link href={issuePath}>
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
                <span className="truncate text-[0.825rem] text-custom-text-100">{issue.name}</span>
              </Tooltip>
            </a>
          </Link>
        </div>

        <div
          className={`flex flex-shrink-0 items-center gap-2 text-xs ${
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
          {properties.labels && <ViewIssueLabel labelDetails={issue.label_details} maxRender={3} />}
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
