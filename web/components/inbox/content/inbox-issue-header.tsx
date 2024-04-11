import { FC, useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { ChevronDown, ChevronUp, Clock, ExternalLink, FileStack, Link, Trash2 } from "lucide-react";
import { Button, ControlLink, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  AcceptIssueModal,
  DeclineIssueModal,
  DeleteInboxIssueModal,
  InboxIssueSnoozeModal,
  InboxIssueStatus,
  SelectDuplicateInboxIssueModal,
} from "@/components/inbox";
import { IssueUpdateStatus } from "@/components/issues";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { EInboxIssueStatus } from "@/helpers/inbox.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useUser, useProjectInbox, useProject } from "@/hooks/store";
// store types
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: "submitting" | "submitted" | "saved";
};

export const InboxIssueActionsHeader: FC<TInboxIssueActionsHeader> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue, isSubmitting } = props;
  // states
  const [isSnoozeDateModalOpen, setIsSnoozeDateModalOpen] = useState(false);
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store
  const { deleteInboxIssue, inboxIssuesArray } = useProjectInbox();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();
  const router = useRouter();
  const { getProjectById } = useProject();

  const issue = inboxIssue?.issue;
  // derived values
  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const canMarkAsDuplicate = isAllowed && inboxIssue?.status === -2;
  const canMarkAsAccepted = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canMarkAsDeclined = isAllowed && inboxIssue?.status === -2;
  const canDelete = isAllowed || inboxIssue?.created_by === currentUser?.id;
  const isAcceptedOrDeclined = inboxIssue?.status ? [-1, 1].includes(inboxIssue.status) : undefined;

  const currentInboxIssueId = inboxIssue?.issue?.id;

  const issueLink = `${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`;

  const handleInboxIssueAccept = async () => {
    await inboxIssue?.updateInboxIssueStatus(EInboxIssueStatus.ACCEPTED);
    setAcceptIssueModal(false);
  };

  const handleInboxIssueDecline = async () => {
    await inboxIssue?.updateInboxIssueStatus(EInboxIssueStatus.DECLINED);
    setDeclineIssueModal(false);
  };

  const handleInboxIssueDuplicate = async (issueId: string) => {
    await inboxIssue?.updateInboxIssueDuplicateTo(issueId);
  };

  const handleInboxSIssueSnooze = async (date: Date) => {
    await inboxIssue?.updateInboxIssueSnoozeTill(date);
    setIsSnoozeDateModalOpen(false);
  };

  const handleInboxIssueDelete = async () => {
    if (!inboxIssue || !currentInboxIssueId) return;
    await deleteInboxIssue(workspaceSlug, projectId, currentInboxIssueId).finally(() => {
      router.push(`/${workspaceSlug}/projects/${projectId}/inbox`);
    });
  };

  const handleCopyIssueLink = () =>
    copyUrlToClipboard(issueLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied",
        message: "Issue link copied to clipboard",
      })
    );

  const currentIssueIndex = inboxIssuesArray.findIndex((issue) => issue.issue.id === currentInboxIssueId) ?? 0;

  const handleInboxIssueNavigation = useCallback(
    (direction: "next" | "prev") => {
      if (!inboxIssuesArray || !currentInboxIssueId) return;
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.classList.contains("tiptap") || activeElement.id === "title-input")) return;
      const nextIssueIndex =
        direction === "next"
          ? (currentIssueIndex + 1) % inboxIssuesArray.length
          : (currentIssueIndex - 1 + inboxIssuesArray.length) % inboxIssuesArray.length;
      const nextIssueId = inboxIssuesArray[nextIssueIndex].issue.id;
      if (!nextIssueId) return;
      router.push(`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${nextIssueId}`);
    },
    [currentInboxIssueId, currentIssueIndex, inboxIssuesArray, projectId, router, workspaceSlug]
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

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

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

        <AcceptIssueModal
          data={inboxIssue?.issue}
          isOpen={acceptIssueModal}
          onClose={() => setAcceptIssueModal(false)}
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
          onConfirm={handleInboxSIssueSnooze}
        />
      </>

      <div className="relative flex h-full w-full items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-4">
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

          <div className="flex flex-wrap items-center gap-2">
            {canMarkAsAccepted && (
              <div className="flex-shrink-0">
                <Button variant="neutral-primary" size="sm" onClick={() => setAcceptIssueModal(true)}>
                  Accept
                </Button>
              </div>
            )}

            {canMarkAsDeclined && (
              <div className="flex-shrink-0">
                <Button variant="neutral-primary" size="sm" onClick={() => setDeclineIssueModal(true)}>
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
                  onClick={handleCopyIssueLink}
                >
                  Copy issue link
                </Button>
                <ControlLink
                  href={`/${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`}
                  onClick={() =>
                    router.push(`/${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`)
                  }
                >
                  <Button variant="neutral-primary" prependIcon={<ExternalLink className="h-2.5 w-2.5" />} size="sm">
                    Open issue
                  </Button>
                </ControlLink>
              </div>
            ) : (
              <CustomMenu verticalEllipsis placement="bottom-start">
                {canMarkAsAccepted && (
                  <CustomMenu.MenuItem onClick={() => setIsSnoozeDateModalOpen(true)}>
                    <div className="flex items-center gap-2">
                      <Clock size={14} strokeWidth={2} />
                      Snooze
                    </div>
                  </CustomMenu.MenuItem>
                )}
                {canMarkAsDuplicate && (
                  <CustomMenu.MenuItem onClick={() => setSelectDuplicateIssue(true)}>
                    <div className="flex items-center gap-2">
                      <FileStack size={14} strokeWidth={2} />
                      Mark as duplicate
                    </div>
                  </CustomMenu.MenuItem>
                )}
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
          </div>
        </div>
      </div>
    </>
  );
});
