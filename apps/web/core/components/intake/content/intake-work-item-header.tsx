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

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Clock, FileStack, MoreHorizontal, MoveRight } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton, getIconButtonStyling } from "@plane/propel/icon-button";
import {
  LinkIcon,
  CopyIcon,
  NewTabIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleFilledIcon,
  CloseCircleFilledIcon,
} from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TNameDescriptionLoader, IInboxIssueStore } from "@plane/types";
import { EInboxIssueStatus } from "@plane/types";
import { ControlLink, CustomMenu, Row } from "@plane/ui";
import {
  copyUrlToClipboard,
  findHowManyDaysLeft,
  formatProjectWorkItemIdentifierForDisplay,
  generateWorkItemLink,
} from "@plane/utils";
// components
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/root";
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { InboxIssueStatus } from "../intake-work-item-status";
import { DeclineIssueModal } from "../modals/decline-work-item-modal";
import { DeleteInboxIssueModal } from "../modals/delete-work-item-modal";
import { SelectDuplicateInboxIssueModal } from "../modals/select-duplicate";
import { InboxIssueSnoozeModal } from "../modals/snooze-work-item-modal";
import { InboxIssueActionsMobileHeader } from "./intake-work-item-mobile-header";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: TNameDescriptionLoader;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
  isNotificationEmbed: boolean;
  embedRemoveCurrentNotification?: () => void;
};

const DEFAULT_PERMISSIONS = {
  canMarkAsAccepted: false,
  canMarkAsDeclined: false,
  canMarkAsDuplicate: false,
  canDelete: false,
};

export const InboxIssueActionsHeader = observer(function InboxIssueActionsHeader(props: TInboxIssueActionsHeader) {
  const {
    workspaceSlug,
    projectId,
    inboxIssue,
    isSubmitting,
    isMobileSidebar,
    setIsMobileSidebar,
    isNotificationEmbed = false,
    embedRemoveCurrentNotification,
  } = props;
  // router
  const router = useAppRouter();
  // states
  const [isSnoozeDateModalOpen, setIsSnoozeDateModalOpen] = useState(false);
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store
  const { currentTab, deleteInboxIssue, filteredInboxIssueIds, permissions: intakePermissions } = useProjectInbox();
  const { getPartialProjectById } = useProject();
  const currentProjectDetails = getPartialProjectById(projectId);
  const { t } = useTranslation();
  const { getProjectById } = useProject();
  // derived values
  const issue = inboxIssue?.issue;
  const currentIntakeWorkItemId = inboxIssue?.issue?.id;
  const isAcceptedOrDeclined = inboxIssue?.status ? [-1, 1, 2].includes(inboxIssue.status) : undefined;
  const permissions = currentIntakeWorkItemId
    ? {
        canMarkAsAccepted: intakePermissions.getCanAccept(workspaceSlug, projectId, currentIntakeWorkItemId),
        canMarkAsDeclined: intakePermissions.getCanDecline(workspaceSlug, projectId, currentIntakeWorkItemId),
        canMarkAsDuplicate: intakePermissions.getCanMarkAsDuplicate(workspaceSlug, projectId, currentIntakeWorkItemId),
        canDelete: intakePermissions.getCanDelete(workspaceSlug, projectId, currentIntakeWorkItemId),
      }
    : DEFAULT_PERMISSIONS;
  // days left for snooze
  const numberOfDaysLeft = findHowManyDaysLeft(inboxIssue?.snoozed_till);

  const redirectIssue = (): string | undefined => {
    let nextOrPreviousIssueId: string | undefined = undefined;
    const currentIssueIndex = filteredInboxIssueIds.findIndex((id) => id === currentIntakeWorkItemId);
    if (filteredInboxIssueIds[currentIssueIndex + 1])
      nextOrPreviousIssueId = filteredInboxIssueIds[currentIssueIndex + 1];
    else if (filteredInboxIssueIds[currentIssueIndex - 1])
      nextOrPreviousIssueId = filteredInboxIssueIds[currentIssueIndex - 1];
    else nextOrPreviousIssueId = undefined;
    return nextOrPreviousIssueId;
  };

  const handleRedirection = (nextOrPreviousIssueId: string | undefined) => {
    if (!isNotificationEmbed) {
      if (nextOrPreviousIssueId)
        router.push(
          `/${workspaceSlug}/projects/${projectId}/intake?currentTab=${currentTab}&inboxIssueId=${nextOrPreviousIssueId}`
        );
      else router.push(`/${workspaceSlug}/projects/${projectId}/intake?currentTab=${currentTab}`);
    }
  };

  const handleInboxIssueAccept = async () => {
    const nextOrPreviousIssueId = redirectIssue();
    await inboxIssue?.updateInboxIssueStatus(EInboxIssueStatus.ACCEPTED);
    setAcceptIssueModal(false);
    handleRedirection(nextOrPreviousIssueId);
  };

  const handleInboxIssueDecline = async () => {
    const nextOrPreviousIssueId = redirectIssue();
    await inboxIssue?.updateInboxIssueStatus(EInboxIssueStatus.DECLINED);
    setDeclineIssueModal(false);
    handleRedirection(nextOrPreviousIssueId);
  };

  const handleInboxIssueSnooze = async (date: Date) => {
    const nextOrPreviousIssueId = redirectIssue();
    await inboxIssue?.updateInboxIssueSnoozeTill(date);
    setIsSnoozeDateModalOpen(false);
    handleRedirection(nextOrPreviousIssueId);
  };

  const handleInboxIssueDuplicate = async (issueId: string) => {
    await inboxIssue?.updateInboxIssueDuplicateTo(issueId);
  };

  const handleInboxIssueDelete = async () => {
    if (!inboxIssue || !currentIntakeWorkItemId) return;
    await deleteInboxIssue(workspaceSlug, projectId, currentIntakeWorkItemId).then(() => {
      if (!isNotificationEmbed) router.push(`/${workspaceSlug}/projects/${projectId}/intake`);
    });
  };

  const handleIssueSnoozeAction = async () => {
    if (inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0) {
      const nextOrPreviousIssueId = redirectIssue();
      await inboxIssue?.updateInboxIssueSnoozeTill(undefined);
      handleRedirection(nextOrPreviousIssueId);
    } else {
      setIsSnoozeDateModalOpen(true);
    }
  };

  const handleCopyIssueLink = (path: string) =>
    copyUrlToClipboard(path).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.copied_to_clipboard"),
      })
    );

  const currentIssueIndex = filteredInboxIssueIds.findIndex((issueId) => issueId === currentIntakeWorkItemId) ?? 0;

  const handleInboxIssueNavigation = useCallback(
    (direction: "next" | "prev") => {
      if (!filteredInboxIssueIds || !currentIntakeWorkItemId) return;
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.classList.contains("tiptap") || activeElement.id === "title-input")) return;
      const nextIssueIndex =
        direction === "next"
          ? (currentIssueIndex + 1) % filteredInboxIssueIds.length
          : (currentIssueIndex - 1 + filteredInboxIssueIds.length) % filteredInboxIssueIds.length;
      const nextIssueId = filteredInboxIssueIds[nextIssueIndex];
      if (!nextIssueId) return;
      router.push(`/${workspaceSlug}/projects/${projectId}/intake?inboxIssueId=${nextIssueId}`);
    },
    [currentIntakeWorkItemId, currentIssueIndex, filteredInboxIssueIds, projectId, router, workspaceSlug]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        handleInboxIssueNavigation("prev");
      } else if (e.key === "ArrowDown") {
        handleInboxIssueNavigation("next");
      }
    },
    [handleInboxIssueNavigation]
  );

  const handleActionWithPermission = (canPerformAction: boolean, action: () => void, errorMessage: string) => {
    if (canPerformAction) action();
    else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Permission denied",
        message: errorMessage,
      });
    }
  };

  useEffect(() => {
    if (isSubmitting === "submitting") return;
    if (!isNotificationEmbed) document.addEventListener("keydown", onKeyDown);
    return () => {
      if (!isNotificationEmbed) document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown, isNotificationEmbed, isSubmitting]);

  if (!inboxIssue) return null;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue?.project_id,
    issueId: currentIntakeWorkItemId,
    projectIdentifier: currentProjectDetails?.identifier,
    sequenceId: issue?.sequence_id,
  });

  return (
    <>
      <>
        <SelectDuplicateInboxIssueModal
          isOpen={selectDuplicateIssue}
          onClose={() => setSelectDuplicateIssue(false)}
          value={inboxIssue?.duplicate_to}
          onSubmit={handleInboxIssueDuplicate}
        />
        <CreateUpdateIssueModal
          data={inboxIssue?.issue}
          isOpen={acceptIssueModal}
          onClose={() => setAcceptIssueModal(false)}
          beforeFormSubmit={handleInboxIssueAccept}
          withDraftIssueWrapper={false}
          fetchIssueDetails={false}
          showActionItemsOnUpdate
          modalTitle={t("inbox_issue.actions.move", {
            value: formatProjectWorkItemIdentifierForDisplay(
              currentProjectDetails?.identifier || "",
              issue?.sequence_id
            ),
          })}
          primaryButtonText={{
            default: t("add_to_project"),
            loading: t("adding"),
          }}
        />
        <DeclineIssueModal
          data={inboxIssue?.issue || {}}
          isOpen={declineIssueModal}
          onClose={() => setDeclineIssueModal(false)}
          onSubmit={handleInboxIssueDecline}
        />
        {inboxIssue.issue && (
          <DeleteInboxIssueModal
            data={inboxIssue?.issue}
            isOpen={deleteIssueModal}
            onClose={() => setDeleteIssueModal(false)}
            onSubmit={handleInboxIssueDelete}
          />
        )}
        <InboxIssueSnoozeModal
          isOpen={isSnoozeDateModalOpen}
          handleClose={() => setIsSnoozeDateModalOpen(false)}
          value={inboxIssue.snoozed_till ?? undefined}
          onConfirm={handleInboxIssueSnooze}
        />
      </>

      <Row className="hidden relative lg:flex h-full w-full items-center justify-between gap-2 bg-surface-1 z-15 border-b border-subtle">
        <div className="flex items-center gap-4">
          {isNotificationEmbed && (
            <button onClick={embedRemoveCurrentNotification}>
              <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
            </button>
          )}
          {issue?.project_id && issue.sequence_id && (
            <h3 className="text-14 font-medium text-tertiary flex-shrink-0">
              {formatProjectWorkItemIdentifierForDisplay(
                getProjectById(issue.project_id)?.identifier || "",
                issue.sequence_id
              )}
            </h3>
          )}
          <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} />
          <div className="flex items-center justify-end w-full">
            <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNotificationEmbed && (
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
          )}

          <div className="flex flex-wrap items-center gap-2">
            {permissions.canMarkAsAccepted && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  handleActionWithPermission(
                    permissions.canMarkAsAccepted,
                    () => setAcceptIssueModal(true),
                    t("inbox_issue.errors.accept_permission")
                  )
                }
              >
                <CheckCircleFilledIcon className="size-4 shrink-0 text-success-secondary" />
                {t("inbox_issue.actions.accept")}
              </Button>
            )}

            {permissions.canMarkAsDeclined && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  handleActionWithPermission(
                    permissions.canMarkAsDeclined,
                    () => setDeclineIssueModal(true),
                    t("inbox_issue.errors.decline_permission")
                  )
                }
              >
                <CloseCircleFilledIcon className="size-4 shrink-0 text-danger-secondary" />
                {t("inbox_issue.actions.decline")}
              </Button>
            )}

            {isAcceptedOrDeclined ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="lg"
                  prependIcon={<LinkIcon className="h-2.5 w-2.5" />}
                  onClick={() => handleCopyIssueLink(workItemLink)}
                >
                  {t("inbox_issue.actions.copy")}
                </Button>
                <ControlLink href={workItemLink} onClick={() => router.push(workItemLink)} target="_self">
                  <Button variant="secondary" size="lg" prependIcon={<NewTabIcon className="h-2.5 w-2.5" />}>
                    {t("inbox_issue.actions.open")}
                  </Button>
                </ControlLink>
              </div>
            ) : (
              <CustomMenu
                customButton={<MoreHorizontal className="size-4" />}
                customButtonClassName={getIconButtonStyling("secondary", "lg")}
                placement="bottom-start"
              >
                {permissions.canMarkAsAccepted && (
                  <CustomMenu.MenuItem
                    onClick={() =>
                      handleActionWithPermission(
                        permissions.canMarkAsAccepted,
                        handleIssueSnoozeAction,
                        t("inbox_issue.errors.snooze_permission")
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} strokeWidth={2} />
                      {inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0
                        ? t("inbox_issue.actions.unsnooze")
                        : t("inbox_issue.actions.snooze")}
                    </div>
                  </CustomMenu.MenuItem>
                )}
                {permissions.canMarkAsDuplicate && (
                  <CustomMenu.MenuItem
                    onClick={() =>
                      handleActionWithPermission(
                        permissions.canMarkAsDuplicate,
                        () => setSelectDuplicateIssue(true),
                        "Only project admins can mark work item as duplicate"
                      )
                    }
                  >
                    <div className="flex items-center gap-2">
                      <FileStack size={14} strokeWidth={2} />
                      {t("inbox_issue.actions.mark_as_duplicate")}
                    </div>
                  </CustomMenu.MenuItem>
                )}
                <CustomMenu.MenuItem onClick={() => handleCopyIssueLink(workItemLink)}>
                  <div className="flex items-center gap-2">
                    <CopyIcon width={14} height={14} strokeWidth={2} />
                    {t("inbox_issue.actions.copy")}
                  </div>
                </CustomMenu.MenuItem>
                {permissions.canDelete && (
                  <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                    <div className="flex items-center gap-2">
                      <TrashIcon width={14} height={14} strokeWidth={2} />
                      {t("inbox_issue.actions.delete")}
                    </div>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            )}
          </div>
        </div>
      </Row>

      <div className="lg:hidden">
        <InboxIssueActionsMobileHeader
          inboxIssue={inboxIssue}
          isSubmitting={isSubmitting}
          handleCopyIssueLink={() => handleCopyIssueLink(workItemLink)}
          setAcceptIssueModal={setAcceptIssueModal}
          setDeclineIssueModal={setDeclineIssueModal}
          handleIssueSnoozeAction={handleIssueSnoozeAction}
          setSelectDuplicateIssue={setSelectDuplicateIssue}
          setDeleteIssueModal={setDeleteIssueModal}
          permissions={permissions}
          isAcceptedOrDeclined={isAcceptedOrDeclined}
          handleInboxIssueNavigation={handleInboxIssueNavigation}
          workspaceSlug={workspaceSlug}
          isMobileSidebar={isMobileSidebar}
          setIsMobileSidebar={setIsMobileSidebar}
          isNotificationEmbed={isNotificationEmbed}
          embedRemoveCurrentNotification={embedRemoveCurrentNotification}
          handleActionWithPermission={handleActionWithPermission}
        />
      </div>
    </>
  );
});
