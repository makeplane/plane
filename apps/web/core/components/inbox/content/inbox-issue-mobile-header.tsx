"use client";

import React from "react";
import { observer } from "mobx-react";
import {
  CircleCheck,
  CircleX,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileStack,
  Link,
  Trash2,
  PanelLeft,
  MoveRight,
} from "lucide-react";
import { TNameDescriptionLoader } from "@plane/types";
import { Header, CustomMenu, EHeaderVariant } from "@plane/ui";
import { cn, findHowManyDaysLeft, generateWorkItemLink } from "@plane/utils";
// components
import { InboxIssueStatus } from "@/components/inbox";
import { NameDescriptionUpdateStatus } from "@/components/issues";
// helpers
// hooks
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// store types
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

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

export const InboxIssueActionsMobileHeader: React.FC<Props> = observer((props) => {
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
          <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200 mr-2" />
        </button>
      )}
      <PanelLeft
        onClick={() => setIsMobileSidebar(!isMobileSidebar)}
        className={cn(
          "w-4 h-4 flex-shrink-0 mr-2 my-auto",
          isMobileSidebar ? "text-custom-primary-100" : "text-custom-text-200"
        )}
      />
      <div className="flex items-center gap-2 w-full bg-custom-background-100 z-[15]">
        <div className="flex items-center gap-x-2">
          <button
            type="button"
            className="rounded border border-custom-border-200 p-1.5"
            onClick={() => handleInboxIssueNavigation("prev")}
          >
            <ChevronUp size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="rounded border border-custom-border-200 p-1.5"
            onClick={() => handleInboxIssueNavigation("next")}
          >
            <ChevronDown size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} />
          <div className="flex items-center justify-end w-full">
            <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
          </div>
        </div>
        <div className="ml-auto">
          <CustomMenu verticalEllipsis placement="bottom-start">
            {isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
                <div className="flex items-center gap-2">
                  <Link size={14} strokeWidth={2} />
                  Copy work item link
                </div>
              </CustomMenu.MenuItem>
            )}
            {isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={() => router.push(workItemLink)}>
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} strokeWidth={2} />
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
                <div className="flex items-center gap-2 text-green-500">
                  <CircleCheck size={14} strokeWidth={2} />
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
                <div className="flex items-center gap-2 text-red-500">
                  <CircleX size={14} strokeWidth={2} />
                  Decline
                </div>
              </CustomMenu.MenuItem>
            )}
            {canDelete && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                <div className="flex items-center gap-2 text-red-500">
                  <Trash2 size={14} strokeWidth={2} />
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
