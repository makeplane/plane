import { FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
// icons
import { CheckCircle2, Clock, FileStack, Trash2, XCircle } from "lucide-react";
// ui
import { Button, CustomMenu } from "@plane/ui";
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
// store types
import type { IInboxIssueStore } from "store/inbox-issue.store";

type TInboxIssueActionsHeader = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  inboxIssue: IInboxIssueStore | undefined;
};

export const InboxIssueActionsHeader: FC<TInboxIssueActionsHeader> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue } = props;
  // router
  const router = useRouter();
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

  console.log("inboxIssue", inboxIssue);
  // derived values
  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const canMarkAsDuplicate = isAllowed && inboxIssue?.status === -2;
  const canMarkAsAccepted = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canMarkAsDeclined = isAllowed && inboxIssue?.status === -2;
  const canDelete = isAllowed || inboxIssue?.created_by === currentUser?.id;

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
    if (!inboxIssue) return;
    deleteInboxIssue(workspaceSlug, projectId, inboxIssue.id);
  };

  const handleInboxSIssueSnooze = async (date: Date) => {
    inboxIssue?.updateSnoozeTill(date);
  };

  // const handleInboxIssueNavigation = (direction: "prev" | "next") => {
  //   const currentIssueIndex = inboxIssuesArray.findIndex((issue) => issue.id === inboxIssue?.id);
  //   const nextIssue = inboxIssuesArray[currentIssueIndex + 1];
  //   const prevIssue = inboxIssuesArray[currentIssueIndex - 1];
  //   if (direction === "next" && nextIssue) {
  //     router.push(`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${nextIssue.id}`);
  //   } else if (direction === "prev" && prevIssue) {
  //     router.push(`/${workspaceSlug}/projects/${projectId}/inbox?inboxIssueId=${prevIssue.id}`);
  //   }
  // };

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
        {/* <div className="flex items-center gap-x-2">
          <button
            type="button"
            className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
            onClick={() => handleInboxIssueNavigation("prev")}
          >
            <ChevronUp size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="rounded border border-custom-border-200 bg-custom-background-90 p-1.5 hover:bg-custom-background-80"
            onClick={() => handleInboxIssueNavigation("next")}
          >
            <ChevronDown size={14} strokeWidth={2} />
          </button>
        </div> */}

        <div className="flex flex-wrap items-center gap-3">
          {canMarkAsAccepted && (
            <div className="flex-shrink-0">
              <Button
                variant="neutral-primary"
                size="sm"
                prependIcon={<CheckCircle2 className="text-green-500" size={14} strokeWidth={2} />}
                onClick={() => setAcceptIssueModal(true)}
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
                prependIcon={<XCircle className="text-red-500" size={14} strokeWidth={2} />}
                onClick={() => setDeclineIssueModal(true)}
              >
                Decline
              </Button>
            </div>
          )}

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
                  <Trash2 className="text-red-500" size={14} strokeWidth={2} />
                  Delete
                </div>
              </CustomMenu.MenuItem>
            )}
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
