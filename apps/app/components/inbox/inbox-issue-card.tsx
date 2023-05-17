// icons
import { getPriorityIcon } from "components/icons";
import { CalendarIcon } from "@heroicons/react/24/outline";

// types
import type { IInboxIssue } from "types";

type Props = {
  issue: IInboxIssue;
  active: boolean;
};

export const InboxIssueCard: React.FC<Props> = (props) => {
  const { issue, active } = props;

  return (
    <div
      id={issue.id}
      className={`relative h-20 cursor-pointer select-none space-y-3 py-2 px-4 border-b hover:bg-brand-accent hover:bg-opacity-10 ${
        active ? "bg-brand-accent bg-opacity-5" : " "
      }`}
    >
      <div className="flex items-center gap-x-2">
        <p className="flex-shrink-0 text-xs">
          {issue.project_detail.identifier}-{issue.issue_detail.sequence_id}
        </p>
        <p className="truncate font-medium">{issue.issue_detail.name}</p>
      </div>
      <div className="flex gap-2">
        {getPriorityIcon(
          issue.issue_detail.priority ?? "None",
          "text-sm rounded bg-orange-200 bg-opacity-50 w-6 h-6 flex justify-center items-center text-orange-600"
        )}
        {issue.snoozed_till && (
          <div className="px-2 rounded border border-brand-base flex gap-1 items-center">
            <CalendarIcon className="h-4 w-4 flex-shrink-0 text-brand-secondary" />
            <p className="text-xs">
              {new Date(issue.snoozed_till).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
