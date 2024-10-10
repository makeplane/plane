"use client";

import { FC, useCallback, useEffect, useState } from "react";
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
  MoveRight,
  Copy,
} from "lucide-react";
import { Button, ControlLink, CustomMenu, Row, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  DeclineIssueModal,
  DeleteInboxIssueModal,
  InboxIssueActionsMobileHeader,
  InboxIssueCreateEditModalRoot,
  InboxIssueSnoozeModal,
  InboxIssueStatus,
  SelectDuplicateInboxIssueModal,
} from "@/components/inbox";
import { IssueUpdateStatus } from "@/components/issues";
// helpers
import { findHowManyDaysLeft } from "@/helpers/date-time.helper";
import { EInboxIssueStatus } from "@/helpers/inbox.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useUser, useProjectInbox, useProject, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// store types
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: "submitting" | "submitted" | "saved";
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
  isNotificationEmbed: boolean;
  embedRemoveCurrentNotification?: () => void;
};

export const InboxIssueActionsHeader: FC<TInboxIssueActionsHeader> = observer((props) => {
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
  // states
  const [isSnoozeDateModalOpen, setIsSnoozeDateModalOpen] = useState(false);
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store
  const { currentTab, deleteInboxIssue, filteredInboxIssueIds } = useProjectInbox();
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();

  const router = useAppRouter();
  const { getProjectById } = useProject();

  const issue = inboxIssue?.issue;
  // derived values
  const isAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const canMarkAsDuplicate = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canMarkAsAccepted = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canMarkAsDeclined = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  // can delete only if admin or is creator of the issue
  const canDelete =
    allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId) ||
    issue?.created_by === currentUser?.id;
  const isProjectAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const isAcceptedOrDeclined = inboxIssue?.status ? [-1, 1, 2].includes(inboxIssue.status) : undefined;
  // days left for snooze
  const numberOfDaysLeft = findHowManyDaysLeft(inboxIssue?.snoozed_till);

  const currentInboxIssueId = inboxIssue?.issue?.id;

  const issueLink = `${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`;
  const intakeIssueLink = `${workspaceSlug}/projects/${issue?.project_id}/inbox/?currentTab=${currentTab}&inboxIssueId=${currentInboxIssueId}`;

  const redirectIssue = (): string | undefined => {
    let nextOrPreviousIssueId: string | undefined = undefined;
    const currentIssueIndex = filteredInboxIssueIds.findIndex((id) => id === currentInboxIssueId);
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
          `/${workspaceSlug}/projects/${projectId}/inbox?currentTab=${currentTab}&inboxIssueId=${nextOrPreviousIssueId}`
        );
      else router.push(`/${workspaceSlug}/projects/${projectId}/inbox?currentTab=${currentTab}`);
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
    if (!inboxIssue || !currentInboxIssueId) return;
    await deleteInboxIssue(workspaceSlug, projectId, currentInboxIssueId).then(() => {
      if (!isNotificationEmbed) router.push(`/${workspaceSlug}/projects/${projectId}/inbox`);
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
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );

  const currentIssueIndex = filteredInboxIssueIds.findIndex((issueId) => issueId === currentInboxIssueId) ?? 0;

  const handleInboxIssueNavigation = useCallback(
    (direction: "next" | "prev") => {
      if (!filteredInboxIssueIds || !currentInboxIssueId) return;
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.classList.contains("tiptap") || activeElement.id === "title-input")) return;
      const nextIssueIndex =
        direction === "next"
          ? (currentIssueIndex + 1) % filteredInboxIssueIds.length
          : (currentIssueIndex - 1 + filteredInboxIssueIds.length) % filteredInboxIssueIds.length;
      const nextIssueId = filteredInboxIssueIds[nextIssueIndex];
      if (!nextIssueId) return;
      router.push(`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${nextIssueId}`);
    },
    [currentInboxIssueId, currentIssueIndex, filteredInboxIssueIds, projectId, router, workspaceSlug]
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

  useEffect(() => {
    if (!isNotificationEmbed) document.addEventListener("keydown", onKeyDown);
    return () => {
      if (!isNotificationEmbed) document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown, isNotificationEmbed]);

  if (!inboxIssue) return null;

  return (
    <>
      <>
        <SelectDuplicateInboxIssueModal
          isOpen={selectDuplicateIssue}
          onClose={() => setSelectDuplicateIssue(false)}
          value={inboxIssue?.duplicate_to}
          onSubmit={handleInboxIssueDuplicate}
        />

        <InboxIssueCreateEditModalRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          modalState={acceptIssueModal}
          handleModalClose={() => setAcceptIssueModal(false)}
          issue={inboxIssue?.issue}
          onSubmit={handleInboxIssueAccept}
        />

        <DeclineIssueModal
          data={inboxIssue?.issue || {}}
          isOpen={declineIssueModal}
          onClose={() => setDeclineIssueModal(false)}
          onSubmit={handleInboxIssueDecline}
        />
        <DeleteInboxIssueModal
          data={inboxIssue?.issue}
          isOpen={deleteIssueModal}
          onClose={() => setDeleteIssueModal(false)}
          onSubmit={handleInboxIssueDelete}
        />
        <InboxIssueSnoozeModal
          isOpen={isSnoozeDateModalOpen}
          handleClose={() => setIsSnoozeDateModalOpen(false)}
          value={inboxIssue?.snoozed_till}
          onConfirm={handleInboxIssueSnooze}
        />
      </>

      <Row className="hidden relative lg:flex h-full w-full items-center justify-between gap-2 bg-custom-background-100 z-[15] border-b border-custom-border-200">
        <div className="flex items-center gap-4">
          {isNotificationEmbed && (
            <button onClick={embedRemoveCurrentNotification}>
              <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
            </button>
          )}
          {issue?.project_id && issue.sequence_id && (
            <h3 className="text-base font-medium text-custom-text-300 flex-shrink-0">
              {getProjectById(issue.project_id)?.identifier}-{issue.sequence_id}
            </h3>
          )}
          <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} />
          <div className="flex items-center justify-end w-full">
            <IssueUpdateStatus isSubmitting={isSubmitting} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNotificationEmbed && (
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
          )}

          <div className="flex flex-wrap items-center gap-2">
            {canMarkAsAccepted && (
              <div className="flex-shrink-0">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  prependIcon={<CircleCheck className="w-3 h-3" />}
                  className="text-green-500 border-0.5 border-green-500 bg-green-500/20 focus:bg-green-500/20 focus:text-green-500 hover:bg-green-500/40 bg-opacity-20"
                  onClick={() =>
                    handleActionWithPermission(
                      isProjectAdmin,
                      () => setAcceptIssueModal(true),
                      "Only project admins can accept issues"
                    )
                  }
                >
                  Accept
                </Button>
              </div>
            )}

            {canMarkAsDeclined && (
              <div className="flex-shrink-0">
                <Button
                  variant="neutral-primary"
                  size="sm"
                  prependIcon={<CircleX className="w-3 h-3" />}
                  className="text-red-500 border-0.5 border-red-500 bg-red-500/20 focus:bg-red-500/20 focus:text-red-500 hover:bg-red-500/40 bg-opacity-20"
                  onClick={() =>
                    handleActionWithPermission(
                      isProjectAdmin,
                      () => setDeclineIssueModal(true),
                      "Only project admins can deny issues"
                    )
                  }
                >
                  Decline
                </Button>
              </div>
            )}

            {isAcceptedOrDeclined ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="neutral-primary"
                  prependIcon={<Link className="h-2.5 w-2.5" />}
                  size="sm"
                  onClick={() => handleCopyIssueLink(issueLink)}
                >
                  Copy issue link
                </Button>
                <ControlLink
                  href={`/${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`}
                  onClick={() =>
                    router.push(`/${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`)
                  }
                  target="_self"
                >
                  <Button variant="neutral-primary" prependIcon={<ExternalLink className="h-2.5 w-2.5" />} size="sm">
                    Open issue
                  </Button>
                </ControlLink>
              </div>
            ) : (
              <>
                {isAllowed && (
                  <CustomMenu verticalEllipsis placement="bottom-start">
                    {canMarkAsAccepted && (
                      <CustomMenu.MenuItem
                        onClick={() =>
                          handleActionWithPermission(
                            isProjectAdmin,
                            handleIssueSnoozeAction,
                            "Only project admins can snooze/Un-snooze issues"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <Clock size={14} strokeWidth={2} />
                          {inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0
                            ? "Un-snooze"
                            : "Snooze"}
                        </div>
                      </CustomMenu.MenuItem>
                    )}
                    {canMarkAsDuplicate && (
                      <CustomMenu.MenuItem
                        onClick={() =>
                          handleActionWithPermission(
                            isProjectAdmin,
                            () => setSelectDuplicateIssue(true),
                            "Only project admins can mark issues as duplicate"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <FileStack size={14} strokeWidth={2} />
                          Mark as duplicate
                        </div>
                      </CustomMenu.MenuItem>
                    )}
                    <CustomMenu.MenuItem onClick={() => handleCopyIssueLink(intakeIssueLink)}>
                      <div className="flex items-center gap-2">
                        <Copy size={14} strokeWidth={2} />
                        Copy issue link
                      </div>
                    </CustomMenu.MenuItem>
                    {canDelete && (
                      <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                        <div className="flex items-center gap-2">
                          <Trash2 size={14} strokeWidth={2} />
                          Delete
                        </div>
                      </CustomMenu.MenuItem>
                    )}
                  </CustomMenu>
                )}
              </>
            )}
          </div>
        </div>
      </Row>

      <div className="lg:hidden">
        <InboxIssueActionsMobileHeader
          inboxIssue={inboxIssue}
          isSubmitting={isSubmitting}
          handleCopyIssueLink={() => handleCopyIssueLink(issueLink)}
          setAcceptIssueModal={setAcceptIssueModal}
          setDeclineIssueModal={setDeclineIssueModal}
          handleIssueSnoozeAction={handleIssueSnoozeAction}
          setSelectDuplicateIssue={setSelectDuplicateIssue}
          setDeleteIssueModal={setDeleteIssueModal}
          canMarkAsAccepted={canMarkAsAccepted}
          canMarkAsDeclined={canMarkAsDeclined}
          canMarkAsDuplicate={canMarkAsDuplicate}
          canDelete={canDelete}
          isAcceptedOrDeclined={isAcceptedOrDeclined}
          handleInboxIssueNavigation={handleInboxIssueNavigation}
          workspaceSlug={workspaceSlug}
          isMobileSidebar={isMobileSidebar}
          setIsMobileSidebar={setIsMobileSidebar}
          isNotificationEmbed={isNotificationEmbed}
          embedRemoveCurrentNotification={embedRemoveCurrentNotification}
          isProjectAdmin={isProjectAdmin}
          handleActionWithPermission={handleActionWithPermission}
        />
      </div>
    </>
  );
});
