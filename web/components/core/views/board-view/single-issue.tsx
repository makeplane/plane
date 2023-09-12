import React, { useCallback, useEffect, useRef, useState } from "react";

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
import useOutsideClickDetector from "hooks/use-outside-click-detector";
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
import { ContextMenu, CustomMenu, Tooltip } from "components/ui";
// icons
import {
  ClipboardDocumentCheckIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import { LayerDiagonalIcon } from "components/icons";
// helpers
import { handleIssuesMutation } from "constants/issue";
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { ICurrentUserResponse, IIssue, IIssueViewProps, ISubIssueResponse, UserAuth } from "types";
// fetch-keys
import { CYCLE_DETAILS, MODULE_DETAILS, SUB_ISSUES } from "constants/fetch-keys";

type Props = {
  type?: string;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  issue: IIssue;
  groupTitle?: string;
  index: number;
  editIssue: () => void;
  makeIssueCopy: () => void;
  removeIssue?: (() => void) | null;
  handleDeleteIssue: (issue: IIssue) => void;
  handleTrashBox: (isDragging: boolean) => void;
  disableUserActions: boolean;
  user: ICurrentUserResponse | undefined;
  userAuth: UserAuth;
  viewProps: IIssueViewProps;
};

export const SingleBoardIssue: React.FC<Props> = ({
  type,
  provided,
  snapshot,
  issue,
  index,
  editIssue,
  makeIssueCopy,
  removeIssue,
  groupTitle,
  handleDeleteIssue,
  handleTrashBox,
  disableUserActions,
  user,
  userAuth,
  viewProps,
}) => {
  // context menu
  const [contextMenu, setContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<React.MouseEvent | null>(null);

  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  const actionSectionRef = useRef<HTMLDivElement | null>(null);

  const { displayFilters, properties, mutateIssues } = viewProps;

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId, moduleId } = router.query;

  const { setToastAlert } = useToast();

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
              displayFilters?.group_by ?? null,
              index,
              displayFilters?.order_by ?? "-created_at",
              prevData
            ),
          false
        );
      }

      issuesService
        .patchIssue(workspaceSlug as string, issue.project, issue.id, formData, user)
        .then(() => {
          mutateIssues();

          if (cycleId) mutate(CYCLE_DETAILS(cycleId as string));
          if (moduleId) mutate(MODULE_DETAILS(moduleId as string));
        });
    },
    [displayFilters, workspaceSlug, cycleId, moduleId, groupTitle, index, mutateIssues, user]
  );

  const getStyle = (
    style: DraggingStyle | NotDraggingStyle | undefined,
    snapshot: DraggableStateSnapshot
  ) => {
    if (displayFilters?.order_by === "sort_order") return style;
    if (!snapshot.isDragging) return {};
    if (!snapshot.isDropAnimating) return style;

    return {
      ...style,
      transitionDuration: `0.001s`,
    };
  };

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
      setIsMenuActive(false);
    });
  };

  useEffect(() => {
    if (snapshot.isDragging) handleTrashBox(snapshot.isDragging);
  }, [snapshot, handleTrashBox]);

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disableUserActions;

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
        <a
          href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <ContextMenu.Item Icon={ArrowTopRightOnSquareIcon}>
            Open issue in new tab
          </ContextMenu.Item>
        </a>
      </ContextMenu>
      <div
        className={`mb-3 rounded bg-custom-background-100 shadow ${
          snapshot.isDragging ? "border-2 border-custom-primary shadow-lg" : ""
        }`}
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={getStyle(provided.draggableProps.style, snapshot)}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(true);
          setContextMenuPosition(e);
        }}
      >
        <div className="flex flex-col justify-between gap-1.5 group/card relative select-none px-3.5 py-3 h-[118px]">
          {!isNotAllowed && (
            <div
              ref={actionSectionRef}
              className={`z-1 absolute top-1.5 right-1.5 hidden group-hover/card:!flex ${
                isMenuActive ? "!flex" : ""
              }`}
            >
              {type && !isNotAllowed && (
                <CustomMenu
                  customButton={
                    <button
                      className="flex w-full cursor-pointer items-center justify-between gap-1 rounded p-1 text-left text-xs duration-300 hover:bg-custom-background-80"
                      onClick={() => setIsMenuActive(!isMenuActive)}
                    >
                      <EllipsisHorizontalIcon className="h-4 w-4" />
                    </button>
                  }
                >
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
                      <span>Copy issue Link</span>
                    </div>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              )}
            </div>
          )}
          <Link href={`/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`}>
            <a className="flex flex-col gap-1.5">
              {properties.key && (
                <div className="text-xs font-medium text-custom-text-200">
                  {issue.project_detail.identifier}-{issue.sequence_id}
                </div>
              )}
              <h5 className="text-sm break-words line-clamp-2">{issue.name}</h5>
            </a>
          </Link>
          <div
            className={`flex items-center gap-2 text-xs ${
              isDropdownActive ? "" : "overflow-x-scroll"
            }`}
          >
            {properties.priority && (
              <ViewPrioritySelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                isNotAllowed={isNotAllowed}
                user={user}
                selfPositioned
              />
            )}
            {properties.state && (
              <ViewStateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                isNotAllowed={isNotAllowed}
                user={user}
                selfPositioned
              />
            )}
            {properties.start_date && issue.start_date && (
              <ViewStartDateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                handleOnOpen={() => setIsDropdownActive(true)}
                handleOnClose={() => setIsDropdownActive(false)}
                user={user}
                isNotAllowed={isNotAllowed}
              />
            )}
            {properties.due_date && issue.target_date && (
              <ViewDueDateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                handleOnOpen={() => setIsDropdownActive(true)}
                handleOnClose={() => setIsDropdownActive(false)}
                user={user}
                isNotAllowed={isNotAllowed}
              />
            )}
            {properties.labels && issue.labels.length > 0 && (
              <ViewIssueLabel labelDetails={issue.label_details} maxRender={2} />
            )}
            {properties.assignee && (
              <ViewAssigneeSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                isNotAllowed={isNotAllowed}
                customButton
                user={user}
                selfPositioned
              />
            )}
            {properties.estimate && issue.estimate_point !== null && (
              <ViewEstimateSelect
                issue={issue}
                partialUpdateIssue={partialUpdateIssue}
                isNotAllowed={isNotAllowed}
                user={user}
                selfPositioned
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
                <Tooltip tooltipHeading="Link" tooltipContent={`${issue.link_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {issue.link_count}
                  </div>
                </Tooltip>
              </div>
            )}
            {properties.attachment_count && issue.attachment_count > 0 && (
              <div className="flex cursor-default items-center rounded-md border border-custom-border-200 px-2.5 py-1 text-xs shadow-sm">
                <Tooltip tooltipHeading="Attachment" tooltipContent={`${issue.attachment_count}`}>
                  <div className="flex items-center gap-1 text-custom-text-200">
                    <PaperClipIcon className="h-3.5 w-3.5 -rotate-45" />
                    {issue.attachment_count}
                  </div>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
