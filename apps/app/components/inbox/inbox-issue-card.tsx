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
      className={`relative h-20 cursor-pointer select-none space-y-3 py-2 px-4 border-b border-brand-base hover:bg-brand-accent hover:bg-opacity-10 ${
        active ? "bg-brand-accent bg-opacity-5" : " "
      } ${issue.issue_inbox[0].status !== -2 ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-x-2">
        <p className="flex-shrink-0 text-brand-secondary text-xs">
          {issue.project_detail.identifier}-{issue.sequence_id}
        </p>
        <h5 className="truncate text-sm">{issue.name}</h5>
      </div>
      <div className="flex gap-2">
        <div
          className={`grid h-6 w-6 place-items-center rounded border items-center shadow-sm ${
            issue.priority === "urgent"
              ? "border-red-500/20 bg-red-500/20 text-red-500"
              : issue.priority === "high"
              ? "border-orange-500/20 bg-orange-500/20 text-orange-500"
              : issue.priority === "medium"
              ? "border-yellow-500/20 bg-yellow-500/20 text-yellow-500"
              : issue.priority === "low"
              ? "border-green-500/20 bg-green-500/20 text-green-500"
              : "border-brand-base"
          }`}
        >
          {getPriorityIcon(
            issue.priority && issue.priority !== "" ? issue.priority ?? "" : "None",
            "text-sm"
          )}
        </div>
        {issue.issue_inbox[0].snoozed_till && (
          <div className="px-2 rounded border border-brand-base flex gap-1 items-center">
            <CalendarIcon className="h-4 w-4 flex-shrink-0 text-brand-secondary" />
            <p className="text-xs">
              {new Date(issue.issue_inbox[0].snoozed_till).toLocaleDateString("en-US", {
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
