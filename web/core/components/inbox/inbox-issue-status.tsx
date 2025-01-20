import React from "react";
import { observer } from "mobx-react";
// constants
// helpers
import { useTranslation } from "@plane/i18n";
import { cn } from "@/helpers/common.helper";
// store
import { INBOX_STATUS } from "@/helpers/inbox.helper";
import { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type Props = {
  inboxIssue: IInboxIssueStore;
  iconSize?: number;
  showDescription?: boolean;
};

export const InboxIssueStatus: React.FC<Props> = observer((props) => {
  const { inboxIssue, iconSize = 16, showDescription = false } = props;
  //hooks
  const { t } = useTranslation();
  // derived values
  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssue.status);

  const isSnoozedDatePassed = inboxIssue.status === 0 && new Date(inboxIssue.snoozed_till ?? "") < new Date();
  if (!inboxIssueStatusDetail || isSnoozedDatePassed) return <></>;

  const description = t(inboxIssueStatusDetail.description(new Date(inboxIssue.snoozed_till ?? "")));

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
          {inboxIssue?.status === 0 && inboxIssue?.snoozed_till ? description : t(inboxIssueStatusDetail.title)}
        </div>
      </div>
      {showDescription && <div className="text-sm whitespace-nowrap">{description}</div>}
    </div>
  );
});
