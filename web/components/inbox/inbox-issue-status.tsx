import React from "react";
import { observer } from "mobx-react";
// constants
import { INBOX_STATUS } from "@/constants/inbox";
// store
import { IInboxIssueStore } from "@/store/inbox-issue.store";

type Props = {
  inboxIssue: IInboxIssueStore;
  iconSize?: number;
  showDescription?: boolean;
};

export const InboxIssueStatus: React.FC<Props> = observer((props) => {
  const { inboxIssue, iconSize = 16, showDescription = false } = props;
  // derived values
  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssue.status);
  const isSnoozedDatePassed = inboxIssue.status === 0 && new Date(inboxIssue.snoozed_till ?? "") < new Date();

  if (!inboxIssueStatusDetail) return <></>;

  const description = inboxIssueStatusDetail.description(new Date(inboxIssue.snoozed_till ?? ""));

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 text-xs rounded px-2 py-0.5 ${inboxIssueStatusDetail.textColor(
          isSnoozedDatePassed
        )} ${inboxIssueStatusDetail.bgColor(isSnoozedDatePassed)}`}
      >
        <inboxIssueStatusDetail.icon size={iconSize} />
        <p className="leading-5 font-medium">{inboxIssueStatusDetail.title}</p>
      </div>
      {showDescription && description}
    </div>
  );
});
