"use client";

// types
import { issuePriorityFilter } from "@/constants/issue";
import { TIssueFilterPriority } from "@/types/issue";
// constants

export const IssueBlockPriority = ({ priority }: { priority: TIssueFilterPriority | null }) => {
  const priority_detail = priority != null ? issuePriorityFilter(priority) : null;

  if (priority_detail === null) return <></>;

  return (
    <div className={`grid h-6 w-6 place-items-center rounded border-[0.5px] ${priority_detail?.className}`}>
      <span className="material-symbols-rounded text-sm">{priority_detail?.icon}</span>
    </div>
  );
};
