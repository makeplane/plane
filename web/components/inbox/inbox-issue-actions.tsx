import { FC, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// icons
import { ChevronDown, ChevronUp, Clock, ExternalLink, FileStack, Link, Trash2 } from "lucide-react";
// ui
import { Button, ControlLink, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
// components
import {
  AcceptIssueModal,
  DeclineIssueModal,
  DeleteInboxIssueModal,
  InboxIssueSnoozeModal,
  SelectDuplicateInboxIssueModal,
} from "components/inbox";
import { EUserProjectRoles } from "constants/project";
// hooks
import { useUser, useProjectInbox } from "hooks/store";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
// store types
import type { IInboxIssueStore } from "store/inbox-issue.store";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore | undefined;
};

export const InboxIssueActionsHeader: FC<TInboxIssueActionsHeader> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue } = props;
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

  const issue = inboxIssue?.issue;
  // derived values
  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const canMarkAsDuplicate = isAllowed && inboxIssue?.status === -2;
  const canMarkAsAccepted = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canMarkAsDeclined = isAllowed && inboxIssue?.status === -2;
  const canDelete = isAllowed || inboxIssue?.created_by === currentUser?.id;
  const isCompleted = inboxIssue?.status === 1;

  const currentInboxIssueId = inboxIssue?.issue.id;

  const issueLink = `${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`;

  const handleInboxIssueDuplicate = (issueId: string) => {
    inboxIssue?.updateDuplicateTo(issueId);
  };

  const handleInboxIssueAccept = async () => {
    inboxIssue?.updateStatus(1);
    setAcceptIssueModal(false);
  };

  const handleInboxIssueDecline = async () => {
    inboxIssue?.updateStatus(-1);
    setDeclineIssueModal(false);
  };

  const handleInboxIssueDelete = async () => {
    if (!inboxIssue || !currentInboxIssueId) return;
    deleteInboxIssue(workspaceSlug, projectId, currentInboxIssueId);
  };

  const handleInboxSIssueSnooze = async (date: Date) => {
    inboxIssue?.updateSnoozeTill(date);
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
      console.log("comming here");
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

        {isSnoozeDateModalOpen && (
          <InboxIssueSnoozeModal
            isOpen={isSnoozeDateModalOpen}
            handleClose={() => setIsSnoozeDateModalOpen(false)}
            value={inboxIssue?.snoozed_till}
            onConfirm={handleInboxSIssueSnooze}
          />
        )}
      </>

      <div className="relative flex h-full w-full items-center justify-end gap-2 px-4">
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

        <div className="flex flex-wrap items-center gap-3">
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

          {isCompleted ? (
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
    </>
  );
});
