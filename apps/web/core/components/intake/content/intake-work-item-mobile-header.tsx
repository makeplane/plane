/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
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
import type { TNameDescriptionLoader, IInboxIssueStore } from "@plane/types";
import { Header, CustomMenu, EHeaderVariant } from "@plane/ui";
import { cn, findHowManyDaysLeft, generateWorkItemLink } from "@plane/utils";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// store types
// local imports
import { InboxIssueStatus } from "../intake-work-item-status";

type Props = {
  workspaceSlug: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: TNameDescriptionLoader;
  handleInboxIssueNavigation: (direction: "next" | "prev") => void;
  isAcceptedOrDeclined: boolean | undefined;
  permissions: {
    canMarkAsAccepted: boolean;
    canMarkAsDeclined: boolean;
    canMarkAsDuplicate: boolean;
    canDelete: boolean;
  };
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
  handleActionWithPermission: (isAdmin: boolean, action: () => void, errorMessage: string) => void;
};

export const InboxIssueActionsMobileHeader = observer(function InboxIssueActionsMobileHeader(props: Props) {
  const {
    inboxIssue,
    isSubmitting,
    handleInboxIssueNavigation,
    permissions,
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
          <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary mr-2" />
        </button>
      )}
      <PanelLeft
        onClick={() => setIsMobileSidebar(!isMobileSidebar)}
        className={cn("w-4 h-4 flex-shrink-0 mr-2 my-auto", isMobileSidebar ? "text-accent-primary" : "text-secondary")}
      />
      <div className="flex items-center gap-2 w-full bg-surface-1 z-[15]">
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
          <div className="flex items-center justify-end w-full">
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
            {permissions.canMarkAsAccepted && (
              <CustomMenu.MenuItem onClick={() => router.push(workItemLink)}>
                <div className="flex items-center gap-2">
                  <NewTabIcon width={14} height={14} strokeWidth={2} />
                  Open work item
                </div>
              </CustomMenu.MenuItem>
            )}
            {permissions.canMarkAsAccepted && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    permissions.canMarkAsAccepted,
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
            {permissions.canMarkAsDuplicate && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    permissions.canMarkAsDuplicate,
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
            {permissions.canMarkAsAccepted && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    permissions.canMarkAsAccepted,
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
            {permissions.canMarkAsDeclined && (
              <CustomMenu.MenuItem
                onClick={() =>
                  handleActionWithPermission(
                    permissions.canMarkAsDeclined,
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
            {permissions.canDelete && !isAcceptedOrDeclined && (
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
