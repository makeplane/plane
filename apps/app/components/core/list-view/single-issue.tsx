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
import { ICurrentUserResponse, IIssue, Properties, UserAuth } from "types";
// fetch-keys
import {
  CYCLE_DETAILS,
  CYCLE_ISSUES_WITH_PARAMS,
  MODULE_DETAILS,
  MODULE_ISSUES_WITH_PARAMS,
  PROJECT_ISSUES_LIST_WITH_PARAMS,
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
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { setToastAlert } = useToast();

  const { groupByProperty: selectedGroup, orderBy, params } = useIssueView();

  const partialUpdateIssue = useCallback(
    (formData: Partial<IIssue>, issueId: string) => {
      if (!workspaceSlug || !projectId) return;

      if (cycleId)
        mutate<
          | {
              [key: string]: IIssue[];
            }
          | IIssue[]
        >(
          CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params),
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

      if (moduleId)
        mutate<
          | {
              [key: string]: IIssue[];
            }
          | IIssue[]
        >(
          MODULE_ISSUES_WITH_PARAMS(moduleId as string, params),
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

      mutate<
        | {
            [key: string]: IIssue[];
          }
        | IIssue[]
      >(
        PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params),
        (prevData) =>
          handleIssuesMutation(formData, groupTitle ?? "", selectedGroup, index, orderBy, prevData),
        false
      );

      issuesService
        .patchIssue(workspaceSlug as string, projectId as string, issueId, formData, user)
        .then(() => {
          if (cycleId) {
            mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));
            mutate(CYCLE_DETAILS(cycleId as string));
          } else if (moduleId) {
            mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
            mutate(MODULE_DETAILS(moduleId as string));
          } else mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params));
        });
    },
    [
      workspaceSlug,
      projectId,
      cycleId,
      moduleId,
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

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || isCompleted;

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
        <a
          href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <ContextMenu.Item Icon={ArrowTopRightOnSquareIcon}>
            Open issue in new tab
          </ContextMenu.Item>
        </a>
      </ContextMenu>
      <div
        className="flex flex-wrap items-center justify-between px-4 py-2.5 gap-2 border-b border-brand-base bg-brand-base last:border-b-0"
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(true);
          setContextMenuPosition({ x: e.pageX, y: e.pageY });
        }}
      >
        <Link href={`/${workspaceSlug}/projects/${issue?.project_detail?.id}/issues/${issue.id}`}>
          <div className="flex-grow cursor-pointer">
            <a className="group relative flex items-center gap-2">
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
                <span className="text-[0.825rem] text-brand-base">
                  {truncateText(issue.name, 50)}
                </span>
              </Tooltip>
            </a>
          </div>
        </Link>

        <div className="flex w-full flex-shrink flex-wrap items-center gap-2 text-xs sm:w-auto">
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
          {properties.due_date && (
            <ViewDueDateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              user={user}
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
              position="right"
              user={user}
              isNotAllowed={isNotAllowed}
            />
          )}
          {properties.estimate && (
            <ViewEstimateSelect
              issue={issue}
              partialUpdateIssue={partialUpdateIssue}
              position="right"
              user={user}
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
