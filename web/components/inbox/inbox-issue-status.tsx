import React from "react";
import { observer } from "mobx-react";
// constants
import { INBOX_STATUS } from "@/constants/inbox";
// helpers
import { cn } from "@/helpers/common.helper";
// store
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type Props = {
  inboxIssue: IInboxIssueStore;
  iconSize?: number;
  showDescription?: boolean;
};

export const InboxIssueStatus: React.FC<Props> = observer((props) => {
  const { inboxIssue, iconSize = 16, showDescription = false } = props;
  // derived values
  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssue.status);
  if (!inboxIssueStatusDetail) return <></>;

  const isSnoozedDatePassed = inboxIssue.status === 0 && new Date(inboxIssue.snoozed_till ?? "") < new Date();

  const description = inboxIssueStatusDetail.description(new Date(inboxIssue.snoozed_till ?? ""));

  return (
    <div
      className={cn(
        `relative flex flex-col gap-1 p-1.5 py-0.5 rounded ${inboxIssueStatusDetail.textColor(
          isSnoozedDatePassed
        )} ${inboxIssueStatusDetail.bgColor(isSnoozedDatePassed)}`
      )}
    >
      <div className={`flex items-center gap-1`}>
        <inboxIssueStatusDetail.icon size={iconSize} className="flex-shrink-0" />
        <div className="font-medium text-xs whitespace-nowrap">
          {inboxIssue?.status === 0 && inboxIssue?.snoozed_till
            ? inboxIssueStatusDetail.description(inboxIssue?.snoozed_till)
            : inboxIssueStatusDetail.title}
        </div>
      </div>
      {showDescription && <div className="text-sm whitespace-nowrap">{description}</div>}
    </div>
  );
});
