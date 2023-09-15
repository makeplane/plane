import React, { FC, useState } from "react";
import { observer } from "mobx-react-lite";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
import { IIssue } from "types";
import useUserAuth from "hooks/use-user-auth";
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
// components
import { Tooltip, CustomMenu, ContextMenu } from "components/ui";
import { LayerDiagonalIcon } from "components/icons";
import {
  ViewAssigneeSelect,
  ViewDueDateSelect,
  ViewEstimateSelect,
  ViewIssueLabel,
  ViewPrioritySelect,
  ViewStartDateSelect,
  ViewStateSelect,
} from "components/issues";
import { IssuePrioritySelect } from "../properties";

export interface IIssueListItem {
  issue: IIssue;
  groupId: string;
}

export const IssueListItem: FC<IIssueListItem> = observer((props) => {
  const { issue, groupId } = props;
  // store
  const { user: userStore, issueFilters: issueFilterStore, issueDetail: issueDetailStore } = useMobxStore();
  const displayProperties = issueFilterStore.userFilters?.display_properties;
  const workspaceId = issueFilterStore.workspaceId;
  const projectId = issueFilterStore.projectId;
  const issueId = issue.id;
  const user = userStore.currentUser;
  console.log("userStore", userStore);
  // context menu
  const [contextMenu, setContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<React.MouseEvent | null>(null);

  const isNotAllowed = false;
  // const isNotAllowed =
  //   userAuth?.isGuest || userAuth?.isViewer || disableUserActions || isArchivedIssues;

  const partialUpdateIssue = (data: any) => {
    // console.log("data", data);
    if (workspaceId && projectId && issueId) issueDetailStore.updateIssueAsync(workspaceId, projectId, issueId, data);
  };

  return (
    <div>
      <>
        <ContextMenu
          clickEvent={contextMenuPosition}
          title="Quick actions"
          isOpen={contextMenu}
          setIsOpen={setContextMenu}
        >
          {/* {!isNotAllowed && (
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
          </a> */}
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
            <div className="group relative flex items-center gap-2">
              {/* {properties.key && (
                <Tooltip
                  tooltipHeading="Issue ID"
                  tooltipContent={`${issue.project_detail?.identifier}-${issue.sequence_id}`}
                >
                  <span className="flex-shrink-0 text-xs text-custom-text-200">
                    {issue.project_detail?.identifier}-{issue.sequence_id}
                  </span>
                </Tooltip>
              )} */}
              <Tooltip position="top-left" tooltipHeading="Title" tooltipContent={issue.name}>
                <button
                  type="button"
                  className="truncate text-[0.825rem] text-custom-text-100"
                  onClick={() => {
                    // if (!isDraftIssues) openPeekOverview(issue);
                    // if (handleDraftIssueSelect) handleDraftIssueSelect(issue);
                  }}
                >
                  {issue.name}
                </button>
              </Tooltip>
            </div>
          </div>

          <div className={`flex flex-shrink-0 items-center gap-2 text-xs `}>
            {displayProperties?.priority && (
              // <ViewPrioritySelect
              //   issue={issue}
              //   partialUpdateIssue={partialUpdateIssue}
              //   position="right"
              //   user={user as any}
              //   isNotAllowed={isNotAllowed}
              // />
              <IssuePrioritySelect issue={issue} groupId={groupId} />
            )}
            {displayProperties?.state && (
              <ViewStateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                position="right"
                user={user as any}
                isNotAllowed={isNotAllowed}
              />
            )}
            {displayProperties?.start_date && issue.start_date && (
              <ViewStartDateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                user={user as any}
                isNotAllowed={isNotAllowed}
              />
            )}
            {displayProperties?.due_date && issue.target_date && (
              <ViewDueDateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                user={user as any}
                isNotAllowed={isNotAllowed}
              />
            )}
            {displayProperties?.labels && <ViewIssueLabel labelDetails={issue.label_details} maxRender={3} />}
            {displayProperties?.assignee && (
              <ViewAssigneeSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                position="right"
                user={user as any}
                isNotAllowed={isNotAllowed}
              />
            )}
            {displayProperties?.estimate && issue.estimate_point !== null && (
              <ViewEstimateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                position="right"
                user={user as any}
                isNotAllowed={isNotAllowed}
              />
            )}
            {displayProperties?.sub_issue_count && issue.sub_issues_count > 0 && (
              <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Sub-issue" tooltipContent={`${issue.sub_issues_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <LayerDiagonalIcon className="h-3.5 w-3.5" />
                    {issue.sub_issues_count}
                  </div>
                </Tooltip>
              </div>
            )}
            {displayProperties?.link && issue.link_count > 0 && (
              <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Links" tooltipContent={`${issue.link_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {issue.link_count}
                  </div>
                </Tooltip>
              </div>
            )}
            {displayProperties?.attachment_count && issue.attachment_count > 0 && (
              <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Attachments" tooltipContent={`${issue.attachment_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <PaperClipIcon className="h-3.5 w-3.5 -rotate-45" />
                    {issue.attachment_count}
                  </div>
                </Tooltip>
              </div>
            )}
            {/* {type && !isNotAllowed && (
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
            )} */}
          </div>
        </div>
      </>
    </div>
  );
});
