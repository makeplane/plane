import React from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
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
} from "lucide-react";
import { CustomMenu } from "@plane/ui";
// components
import { InboxIssueStatus } from "@/components/inbox";
import { IssueUpdateStatus } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// store types
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type Props = {
  workspaceSlug: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: "submitting" | "submitted" | "saved";
  handleInboxIssueNavigation: (direction: "next" | "prev") => void;
  canMarkAsAccepted: boolean;
  canMarkAsDeclined: boolean;
  isAcceptedOrDeclined: boolean | undefined;
  canMarkAsDuplicate: boolean;
  canDelete: boolean;
  setAcceptIssueModal: (value: boolean) => void;
  setDeclineIssueModal: (value: boolean) => void;
  setDeleteIssueModal: (value: boolean) => void;
  setIsSnoozeDateModalOpen: (value: boolean) => void;
  setSelectDuplicateIssue: (value: boolean) => void;
  handleCopyIssueLink: () => void;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
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
    setIsSnoozeDateModalOpen,
    setSelectDuplicateIssue,
    handleCopyIssueLink,
    isMobileSidebar,
    setIsMobileSidebar,
  } = props;
  const router = useRouter();
  const issue = inboxIssue?.issue;
  const currentInboxIssueId = issue?.id;

  if (!issue || !inboxIssue) return null;

  return (
    <div className="h-12 relative flex border-custom-border-200 w-full items-center gap-2 px-4">
      <PanelLeft
        onClick={() => setIsMobileSidebar(!isMobileSidebar)}
        className={cn(
          "w-4 h-4 flex-shrink-0 mr-2",
          isMobileSidebar ? "text-custom-primary-100" : "text-custom-text-200"
        )}
      />
      <div className="flex items-center gap-2 w-full">
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
            <IssueUpdateStatus isSubmitting={isSubmitting} />
          </div>
        </div>
        <div className="ml-auto">
          <CustomMenu verticalEllipsis placement="bottom-start">
            {isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
                <div className="flex items-center gap-2">
                  <Link size={14} strokeWidth={2} />
                  Copy issue link
                </div>
              </CustomMenu.MenuItem>
            )}
            {isAcceptedOrDeclined && (
              <CustomMenu.MenuItem
                onClick={() =>
                  router.push(`/${workspaceSlug}/projects/${issue?.project_id}/issues/${currentInboxIssueId}`)
                }
              >
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} strokeWidth={2} />
                  Open issue
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsAccepted && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={() => setIsSnoozeDateModalOpen(true)}>
                <div className="flex items-center gap-2">
                  <Clock size={14} strokeWidth={2} />
                  Snooze
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsDuplicate && !isAcceptedOrDeclined && (
              <CustomMenu.MenuItem onClick={() => setSelectDuplicateIssue(true)}>
                <div className="flex items-center gap-2">
                  <FileStack size={14} strokeWidth={2} />
                  Mark as duplicate
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsAccepted && (
              <CustomMenu.MenuItem onClick={() => setAcceptIssueModal(true)}>
                <div className="flex items-center gap-2 text-green-500">
                  <CircleCheck size={14} strokeWidth={2} />
                  Accept
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsDeclined && (
              <CustomMenu.MenuItem onClick={() => setDeclineIssueModal(true)}>
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
    </div>
  );
});
