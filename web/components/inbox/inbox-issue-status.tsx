import React from "react";
import { observer } from "mobx-react";
// constants
import { INBOX_STATUS } from "constants/inbox";
// types
import { TInboxIssue } from "@plane/types";

type Props = {
  workspaceSlug: string;
  projectId: string;
  inboxIssue: TInboxIssue;
  iconSize?: number;
  showDescription?: boolean;
};

export const InboxIssueStatus: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssue, iconSize = 18, showDescription = false } = props;
  // derived values
  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssue.status);
  const isSnoozedDatePassed = inboxIssue.status === 0 && new Date(inboxIssue.snoozed_till ?? "") < new Date();

  if (!inboxIssueStatusDetail) return <></>;

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
          inboxIssue.duplicate_to ?? "",
          new Date(inboxIssue.snoozed_till ?? "")
        )
      ) : (
        <span>{inboxIssueStatusDetail.title}</span>
      )}
    </div>
  );
});
