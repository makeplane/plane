/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Clock, FileStack, MoreHorizontal, PanelLeft, MoveRight } from "lucide-react";
import { IconButton, getIconButtonStyling } from "@plane/propel/icon-button";
import {
  LinkIcon,
  NewTabIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleFilledIcon,
  CloseCircleFilledIcon,
} from "@plane/propel/icons";
import type { TNameDescriptionLoader } from "@plane/types";

import { Header, CustomMenu, EHeaderVariant } from "@plane/ui";
import { cn, findHowManyDaysLeft, generateWorkItemLink } from "@plane/utils";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// store types
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

// local imports
import { InboxIssueStatus } from "../inbox-issue-status";

type Props = {
  workspaceSlug: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: TNameDescriptionLoader;
  handleInboxIssueNavigation: (direction: "next" | "prev") => void;
  canMarkAsAccepted: boolean;
  canMarkAsDeclined: boolean;
  isAcceptedOrDeclined: boolean | undefined;
  canMarkAsDuplicate: boolean;
  canDelete: boolean;
  setAcceptIssueModal: (value: boolean) => void;
  setDeclineIssueModal: (value: boolean) => void;
  setDeleteIssueModal: (value: boolean) => void;
  handleIssueSnoozeAction: () => Promise<void>;
  setSelectDuplicateIssue: (value: boolean) => void;
  handleCopyIssueLink: () => void;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
  isNotificationEmbed: boolean;
  embedRemoveCurrentNotification?: () => void;
  isProjectAdmin: boolean;
  handleActionWithPermission: (isAdmin: boolean, action: () => void, errorMessage: string) => void;
};

export const InboxIssueActionsMobileHeader = observer(function InboxIssueActionsMobileHeader(props: Props) {
  const {
    inboxIssue,
    isSubmitting,
    handleInboxIssueNavigation,
    canMarkAsAccepted,
    canMarkAsDeclined,
    canDelete,
    canMarkAsDuplicate,
    isAcceptedOrDeclined,
    workspaceSlug,
    setAcceptIssueModal,
    setDeclineIssueModal,
    setDeleteIssueModal,
    handleIssueSnoozeAction,
    setSelectDuplicateIssue,
    handleCopyIssueLink,
    isMobileSidebar,
    setIsMobileSidebar,
    isNotificationEmbed,
    embedRemoveCurrentNotification,
    isProjectAdmin,
    handleActionWithPermission,
  } = props;
  const router = useAppRouter();
  const { getProjectIdentifierById } = useProject();

  const issue = inboxIssue?.issue;
  const currentInboxIssueId = issue?.id;
  // days left for snooze
  const numberOfDaysLeft = findHowManyDaysLeft(inboxIssue?.snoozed_till);

  if (!issue || !inboxIssue) return null;

  const projectIdentifier = getProjectIdentifierById(issue?.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue?.project_id,
    issueId: currentInboxIssueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
  });

  return (
    <Header variant={EHeaderVariant.SECONDARY} className="justify-start">
      {isNotificationEmbed && (
        <button onClick={embedRemoveCurrentNotification}>
          <MoveRight className="mr-2 h-4 w-4 text-tertiary hover:text-secondary" />
        </button>
      )}
      <PanelLeft
        onClick={() => setIsMobileSidebar(!isMobileSidebar)}
        className={cn("my-auto mr-2 h-4 w-4 flex-shrink-0", isMobileSidebar ? "text-accent-primary" : "text-secondary")}
      />
      <div className="z-[15] flex w-full items-center gap-2 bg-surface-1">
        <div className="flex items-center gap-x-2">
          <IconButton
            variant="secondary"
            size="lg"
            icon={ChevronUpIcon}
            aria-label="Previous work item"
            onClick={() => handleInboxIssueNavigation("prev")}
          />
          <IconButton
            variant="secondary"
            size="lg"
            icon={ChevronDownIcon}
            aria-label="Next work item"
            onClick={() => handleInboxIssueNavigation("next")}
          />
        </div>
        <div className="flex items-center gap-4">
          <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} />
          <div className="flex w-full items-center justify-end">
            <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
          </div>
        </div>
        <div className="ml-auto">
          <CustomMenu
            customButton={<MoreHorizontal className="size-4" />}
            customButtonClassName={getIconButtonStyling("secondary", "lg")}
            placement="bottom-start"
          >
            {isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
                <div className="flex items-center gap-2">
                  <LinkIcon width={14} height={14} strokeWidth={2} />
                  Copy work item link
                </div>
              </CustomMenu.MenuItem>
            )}
            {isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={() => router.push(workItemLink)}>
                <div className="flex items-center gap-2">
                  <NewTabIcon width={14} height={14} strokeWidth={2} />
                  Open work item
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsAccepted && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    isProjectAdmin,
                    handleIssueSnoozeAction,
                    "Only project admins can snooze/Un-snooze work items"
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} strokeWidth={2} />
                  {inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0 ? "Un-snooze" : "Snooze"}
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsDuplicate && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    isProjectAdmin,
                    () => setSelectDuplicateIssue(true),
                    "Only project admins can mark work items as duplicate"
                  )
                }
              >
                <div className="flex items-center gap-2">
                  <FileStack size={14} strokeWidth={2} />
                  Mark as duplicate
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsAccepted && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    isProjectAdmin,
                    () => setAcceptIssueModal(true),
                    "Only project admins can accept work items"
                  )
                }
              >
                <div className="flex items-center gap-2 text-success-secondary">
                  <CheckCircleFilledIcon width={14} height={14} />
                  Accept
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsDeclined && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    isProjectAdmin,
                    () => setDeclineIssueModal(true),
                    "Only project admins can deny work items"
                  )
                }
              >
                <div className="flex items-center gap-2 text-danger-secondary">
                  <CloseCircleFilledIcon width={14} height={14} />
                  Decline
                </div>
              </CustomMenu.MenuItem>
            )}
            {canDelete && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                <div className="flex items-center gap-2 text-danger-primary">
                  <TrashIcon height={14} width={14} strokeWidth={2} />
                  Delete
                </div>
              </CustomMenu.MenuItem>
            )}
          </CustomMenu>
        </div>
      </div>
    </Header>
  );
});
