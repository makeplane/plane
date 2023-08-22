"use client";

// types
import { TIssuePriorityKey } from "store/types/issue";
// constants
import { issuePriorityFilter } from "constants/data";

export const IssueBlockPriority = ({ priority }: { priority: TIssuePriorityKey | null }) => {
  const priority_detail = priority != null ? issuePriorityFilter(priority) : null;

  if (priority_detail === null) return <></>;
  return (
    <div className={`w-[24px] h-[24px] rounded-sm flex justify-center items-center ${priority_detail?.className}`}>
      <span className="material-symbols-rounded text-[16px]">{priority_detail?.icon}</span>
    </div>
  );
};
