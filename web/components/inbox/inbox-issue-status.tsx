import React from "react";
// hooks
import { useInboxIssues } from "hooks/store";
// constants
import { INBOX_STATUS } from "constants/inbox";

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  issueId: string;
  iconSize?: number;
  showDescription?: boolean;
};

export const InboxIssueStatus: React.FC<Props> = (props) => {
  const { workspaceSlug, projectId, inboxId, issueId, iconSize = 18, showDescription = false } = props;
  // hooks
  const {
    issues: { getInboxIssueByIssueId },
  } = useInboxIssues();

  const inboxIssueDetail = getInboxIssueByIssueId(inboxId, issueId);
  if (!inboxIssueDetail) return <></>;

  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssueDetail.status);
  if (!inboxIssueStatusDetail) return <></>;

  const isSnoozedDatePassed =
    inboxIssueDetail.status === 0 && new Date(inboxIssueDetail.snoozed_till ?? "") < new Date();

  return (
    <div
      className={`flex items-center ${inboxIssueStatusDetail.textColor(isSnoozedDatePassed)} ${
        showDescription
          ? `p-3 gap-2 text-sm rounded-md border ${inboxIssueStatusDetail.bgColor(
              isSnoozedDatePassed
            )} ${inboxIssueStatusDetail.borderColor(isSnoozedDatePassed)} `
          : "w-full justify-end gap-1 text-xs"
      }`}
    >
      <inboxIssueStatusDetail.icon size={iconSize} strokeWidth={2} />
      {showDescription ? (
        inboxIssueStatusDetail.description(
          workspaceSlug,
          projectId,
          inboxIssueDetail.duplicate_to ?? "",
          new Date(inboxIssueDetail.snoozed_till ?? "")
        )
      ) : (
        <span>{inboxIssueStatusDetail.title}</span>
      )}
    </div>
  );
};
