import { FC } from "react";
// icons
import { X } from "lucide-react";
// constants
import { INBOX_STATUS } from "constants/inbox";
import { observer } from "mobx-react";

export type InboxIssueAppliedStatusFiltersProps = {
  statuses: number[];
  removeStatus: (value: number) => void;
};

export const IssueStatusLabel = ({ status }: { status: number }) => {
  const issueStatusDetail = INBOX_STATUS.find((s) => s.status === status);

  if (!issueStatusDetail) return <></>;

  return (
    <div className="relative flex items-center gap-1">
      <div className={issueStatusDetail.textColor(false)}>
        <issueStatusDetail.icon size={12} />
      </div>
      <div>{issueStatusDetail.title}</div>
    </div>
  );
};

export const InboxIssueAppliedStatusFilters: FC<InboxIssueAppliedStatusFiltersProps> = observer((props) => {
  const { statuses, removeStatus } = props;
  return (
    <>
      {statuses.map((status) => (
        <div
          key={status}
          className="inline-flex items-center gap-x-1 rounded-full bg-custom-background-90 px-2 py-0.5 capitalize text-custom-text-200"
        >
          <IssueStatusLabel status={status} />
          <button type="button" className="cursor-pointer" onClick={() => removeStatus(status)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </>
  );
});
