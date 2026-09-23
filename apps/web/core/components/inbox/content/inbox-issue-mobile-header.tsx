/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import {
  ArrowNarrowRightOutline,
  ChevronDownOutline,
  ChevronUpOutline,
  ClockOutline,
  CloseCircleFilled,
  DeleteOutline,
  DuplicateOfOutline,
  LeftSidePaneOutline,
  LinkOutline,
  MoreHorizontalOutline,
  NewTabOutline,
  TickCircleFilled,
} from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import type { TNameDescriptionLoader } from "@plane/types";

import { Header, EHeaderVariant } from "@plane/blocks/layout";
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
  const { t } = useTranslation();
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
          <ArrowNarrowRightOutline className="mr-2 h-4 w-4 text-tertiary hover:text-secondary" />
        </button>
      )}
      <LeftSidePaneOutline
        onClick={() => setIsMobileSidebar(!isMobileSidebar)}
        className={cn("my-auto mr-2 h-4 w-4 flex-shrink-0", isMobileSidebar ? "text-accent-primary" : "text-secondary")}
      />
      <div className="z-[15] flex w-full items-center gap-2 bg-surface-1">
        <div className="flex items-center gap-x-2">
          <IconButton
            variant="secondary"
            size="md"
            icon={<Icon icon={ChevronUpOutline} />}
            aria-label="Previous work item"
            onClick={() => handleInboxIssueNavigation("prev")}
          />
          <IconButton
            variant="secondary"
            size="md"
            icon={<Icon icon={ChevronDownOutline} />}
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
          <Menu>
            <MenuTrigger
              render={
                <IconButton
                  variant="secondary"
                  size="md"
                  icon={<Icon icon={MoreHorizontalOutline} />}
                  aria-label={t("aria_labels.common.more_actions")}
                />
              }
            />
            <MenuContent side="bottom" align="start">
              {isAcceptedOrDeclined && (
                <MenuItem
                  icon={<Icon icon={LinkOutline} />}
                  label="Copy work item link"
                  onClick={handleCopyIssueLink}
                />
              )}
              {isAcceptedOrDeclined && (
                <MenuItem
                  icon={<Icon icon={NewTabOutline} />}
                  label="Open work item"
                  onClick={() => router.push(workItemLink)}
                />
              )}
              {canMarkAsAccepted && !isAcceptedOrDeclined && (
                <MenuItem
                  icon={<Icon icon={ClockOutline} />}
                  label={inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0 ? "Un-snooze" : "Snooze"}
                  onClick={() =>
                    handleActionWithPermission(
                      isProjectAdmin,
                      handleIssueSnoozeAction,
                      "Only project admins can snooze/Un-snooze work items"
                    )
                  }
                />
              )}
              {canMarkAsDuplicate && !isAcceptedOrDeclined && (
                <MenuItem
                  icon={<Icon icon={DuplicateOfOutline} />}
                  label="Mark as duplicate"
                  onClick={() =>
                    handleActionWithPermission(
                      isProjectAdmin,
                      () => setSelectDuplicateIssue(true),
                      "Only project admins can mark work items as duplicate"
                    )
                  }
                />
              )}
              {canMarkAsAccepted && (
                // Propel menu rows are neutral/accent/danger only, so the accept/decline tint lives on the glyph.
                <MenuItem
                  icon={<Icon icon={<TickCircleFilled className="text-success-secondary" />} />}
                  label="Accept"
                  onClick={() =>
                    handleActionWithPermission(
                      isProjectAdmin,
                      () => setAcceptIssueModal(true),
                      "Only project admins can accept work items"
                    )
                  }
                />
              )}
              {canMarkAsDeclined && (
                <MenuItem
                  icon={<Icon icon={<CloseCircleFilled className="text-danger-secondary" />} />}
                  label="Decline"
                  onClick={() =>
                    handleActionWithPermission(
                      isProjectAdmin,
                      () => setDeclineIssueModal(true),
                      "Only project admins can deny work items"
                    )
                  }
                />
              )}
              {canDelete && !isAcceptedOrDeclined && (
                <MenuItem
                  variant="danger"
                  icon={<Icon icon={DeleteOutline} />}
                  label="Delete"
                  onClick={() => setDeleteIssueModal(true)}
                />
              )}
            </MenuContent>
          </Menu>
        </div>
      </div>
    </Header>
  );
});
