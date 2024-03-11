import { FC } from "react";
import { observer } from "mobx-react-lite";
import { X } from "lucide-react";
// ui
import { PriorityIcon } from "@plane/ui";
// types
import { TIssuePriorities } from "@plane/types";

export type InboxIssueAppliedPriorityFiltersProps = {
  priorities: string[];
  removeFilter: (value: string) => void;
};

export const InboxIssueAppliedPriorityFilters: FC<InboxIssueAppliedPriorityFiltersProps> = observer((props) => {
  const { priorities, removeFilter } = props;

  return (
    <>
      {priorities.map((priority) => (
        <div
          key={priority}
          className={`inline-flex items-center gap-x-1 rounded-full px-2 py-0.5 capitalize ${
            priority === "urgent"
              ? "bg-red-500/20 text-red-500"
              : priority === "high"
              ? "bg-orange-500/20 text-orange-500"
              : priority === "medium"
              ? "bg-yellow-500/20 text-yellow-500"
              : priority === "low"
              ? "bg-green-500/20 text-green-500"
              : "bg-custom-background-90 text-custom-text-200"
          }`}
        >
          <div className="relative flex items-center gap-1">
            <div>
              <PriorityIcon priority={priority as TIssuePriorities} size={14} />
            </div>
            <div>{priority}</div>
          </div>
          <button type="button" className="cursor-pointer" onClick={() => removeFilter(priority)}>
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </>
  );
});
