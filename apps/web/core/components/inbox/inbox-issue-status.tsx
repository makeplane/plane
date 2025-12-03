import React from "react";
import { observer } from "mobx-react";
// constants
// helpers
import { INBOX_STATUS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn, findHowManyDaysLeft } from "@plane/utils";
// store
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { ICON_PROPERTIES, InboxStatusIcon } from "./inbox-status-icon";

type Props = {
  inboxIssue: IInboxIssueStore;
  iconSize?: number;
  showDescription?: boolean;
};

export const InboxIssueStatus = observer(function InboxIssueStatus(props: Props) {
  const { inboxIssue, iconSize = 16, showDescription = false } = props;
  //hooks
  const { t } = useTranslation();
  // derived values
  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssue.status);

  const isSnoozedDatePassed = inboxIssue.status === 0 && new Date(inboxIssue.snoozed_till ?? "") < new Date();
  if (!inboxIssueStatusDetail || isSnoozedDatePassed) return <></>;

  const description = t(inboxIssueStatusDetail.i18n_description(), {
    days: findHowManyDaysLeft(new Date(inboxIssue.snoozed_till ?? "")),
  });
  const statusIcon = ICON_PROPERTIES[inboxIssue?.status];

  return (
    <div
      className={cn(
        `relative flex flex-col gap-1 p-1.5 py-0.5 rounded-sm ${statusIcon.textColor(
          isSnoozedDatePassed
        )} ${statusIcon.bgColor(isSnoozedDatePassed)}`
      )}
    >
      <div className={`flex items-center gap-1`}>
        <InboxStatusIcon type={inboxIssue?.status} size={iconSize} className="flex-shrink-0" renderColor={false} />
        <div className="font-medium text-11 whitespace-nowrap">
          {inboxIssue?.status === 0 && inboxIssue?.snoozed_till ? description : t(inboxIssueStatusDetail.i18n_title)}
        </div>
      </div>
      {showDescription && <div className="text-13 whitespace-nowrap">{description}</div>}
    </div>
  );
});
