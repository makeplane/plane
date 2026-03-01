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

import { useState } from "react";
import { observer } from "mobx-react";
import { CircleCheck, CircleX, Clock, FileStack, MoreHorizontal } from "lucide-react";
// plane imports
import { INTAKE_DISABLED_STATUSES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { LinkIcon, CopyIcon, NewTabIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInboxIssueStore } from "@plane/types";
import { IconButton } from "@plane/propel/icon-button";
import { EInboxIssueStatus } from "@plane/types";
import { ControlLink, CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, findHowManyDaysLeft, generateWorkItemLink } from "@plane/utils";
// components
import { CreateUpdateIssueModal } from "@/components/issues/issue-modal/root";
// hooks
import { useIntakePermissions } from "@/hooks/use-intake-permissions";
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { DeclineIssueModal } from "../modals/decline-work-item-modal";
import { DeleteInboxIssueModal } from "../modals/delete-work-item-modal";
import { SelectDuplicateInboxIssueModal } from "../modals/select-duplicate";
import { InboxIssueSnoozeModal } from "../modals/snooze-work-item-modal";

type TIntakeWorkitemActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore | undefined;
};

export const IntakeWorkitemActionsHeader = observer(function IntakeWorkitemActionsHeader(
  props: TIntakeWorkitemActionsHeader
) {
  const { workspaceSlug, projectId, inboxIssue } = props;
  // states
  const [isSnoozeDateModalOpen, setIsSnoozeDateModalOpen] = useState(false);
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store
  const { deleteInboxIssue } = useProjectInbox();
  const { getPartialProjectById } = useProject();
  const currentProjectDetails = getPartialProjectById(projectId);
  const { t } = useTranslation();

  const router = useAppRouter();

  const issue = inboxIssue?.issue;
  // derived values - use centralized permission hook
  const {
    canDelete,
    canAccept: canMarkAsAccepted,
    canDecline: canMarkAsDeclined,
    canMarkAsDuplicate,
    isProjectAdmin,
    isAllowed,
  } = useIntakePermissions(workspaceSlug, projectId, inboxIssue);

  const isAcceptedOrDeclined =
    typeof inboxIssue?.status === "number" &&
    (INTAKE_DISABLED_STATUSES as readonly number[]).includes(inboxIssue.status);
  // days left for snooze
  const numberOfDaysLeft = findHowManyDaysLeft(inboxIssue?.snoozed_till);

  const currentInboxIssueId = inboxIssue?.issue?.id;

  const handleInboxIssueAccept = async () => {
    await inboxIssue?.updateInboxIssueStatus(EInboxIssueStatus.ACCEPTED);
    setAcceptIssueModal(false);
  };

  const handleInboxIssueDecline = async () => {
    await inboxIssue?.updateInboxIssueStatus(EInboxIssueStatus.DECLINED);
    setDeclineIssueModal(false);
  };

  const handleInboxIssueSnooze = async (date: Date) => {
    await inboxIssue?.updateInboxIssueSnoozeTill(date);
    setIsSnoozeDateModalOpen(false);
  };

  const handleInboxIssueDuplicate = async (issueId: string) => {
    await inboxIssue?.updateInboxIssueDuplicateTo(issueId);
  };

  const handleInboxIssueDelete = async () => {
    if (!inboxIssue || !currentInboxIssueId) return;
    await deleteInboxIssue(workspaceSlug, projectId, currentInboxIssueId).then(() =>
      router.push(`/${workspaceSlug}/projects/${projectId}/intake`)
    );
  };

  const handleIssueSnoozeAction = async () => {
    if (inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0) {
      await inboxIssue?.updateInboxIssueSnoozeTill(undefined);
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

  const handleActionWithPermission = (isAdmin: boolean, action: () => void, errorMessage: string) => {
    if (isAdmin) action();
    else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Permission denied",
        message: errorMessage,
      });
    }
  };

  if (!inboxIssue) return null;

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue?.project_id,
    issueId: currentInboxIssueId,
    projectIdentifier: currentProjectDetails?.identifier,
    sequenceId: issue?.sequence_id,
  });

  return (
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
          value: `${currentProjectDetails?.identifier}-${issue?.sequence_id}`,
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

      <div className="flex flex-wrap items-center gap-2">
        {canMarkAsAccepted && (
          <div className="shrink-0">
            <Button
              variant="secondary"
              prependIcon={<CircleCheck className="w-3 h-3" />}
              className="text-on-color border border-success-strong bg-success-primary focus:bg-success-primary focus:text-success-primary hover:bg-success-primary"
              onClick={() =>
                handleActionWithPermission(
                  isProjectAdmin,
                  () => setAcceptIssueModal(true),
                  t("inbox_issue.errors.accept_permission")
                )
              }
            >
              {t("inbox_issue.actions.accept")}
            </Button>
          </div>
        )}

        {canMarkAsDeclined && (
          <div className="shrink-0">
            <Button
              variant="secondary"
              prependIcon={<CircleX className="w-3 h-3" />}
              className="text-on-color border border-danger-strong bg-danger-primary focus:bg-danger-primary focus:text-danger-primary hover:bg-danger-primary-hover"
              onClick={() =>
                handleActionWithPermission(
                  isProjectAdmin,
                  () => setDeclineIssueModal(true),
                  t("inbox_issue.errors.decline_permission")
                )
              }
            >
              {t("inbox_issue.actions.decline")}
            </Button>
          </div>
        )}

        {isAcceptedOrDeclined ? (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              prependIcon={<LinkIcon className="h-2.5 w-2.5" />}
              onClick={() => handleCopyIssueLink(workItemLink)}
            >
              {t("inbox_issue.actions.copy")}
            </Button>
            <ControlLink href={workItemLink} onClick={() => router.push(workItemLink)} target="_self">
              <Button variant="secondary" prependIcon={<NewTabIcon className="h-2.5 w-2.5" />}>
                {t("inbox_issue.actions.open")}
              </Button>
            </ControlLink>
          </div>
        ) : (
          <>
            {isAllowed && (
              <CustomMenu
                customButton={<IconButton icon={MoreHorizontal} variant="secondary" />}
                placement="bottom-start"
              >
                {canMarkAsAccepted && (
                  <CustomMenu.MenuItem
                    onClick={() =>
                      handleActionWithPermission(
                        isProjectAdmin,
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
                {canMarkAsDuplicate && (
                  <CustomMenu.MenuItem
                    onClick={() =>
                      handleActionWithPermission(
                        isProjectAdmin,
                        () => setSelectDuplicateIssue(true),
                        t("inbox_issue.errors.duplicate_permission")
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
                {canDelete && (
                  <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                    <div className="flex items-center gap-2">
                      <TrashIcon width={14} height={14} strokeWidth={2} />
                      {t("inbox_issue.actions.delete")}
                    </div>
                  </CustomMenu.MenuItem>
                )}
              </CustomMenu>
            )}
          </>
        )}
      </div>
    </>
  );
});
