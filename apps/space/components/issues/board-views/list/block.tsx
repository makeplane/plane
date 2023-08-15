"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { IssueBlockPriority } from "components/issues/board-views/block-priority";
import { IssueBlockState } from "components/issues/board-views/block-state";
import { IssueBlockLabels } from "components/issues/board-views/block-labels";
import { IssueBlockDueDate } from "components/issues/board-views/block-due-date";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// interfaces
import { IIssue } from "store/types/issue";
import { RootStore } from "store/root";

export const IssueListBlock = ({ issue }: { issue: IIssue }) => {
  const store: RootStore = useMobxStore();

  return (
    <div className="p-2 px-3 relative flex items-center gap-3">
      <div className="relative flex items-center gap-3 w-full">
        {/* id */}
        <div className="flex-shrink-0 text-sm text-gray-600 w-[60px]">
          {store?.project?.project?.identifier}-{issue?.sequence_id}
        </div>
        {/* name */}
        <div className="font-medium text-gray-800 h-full line-clamp-1">{issue.name}</div>
      </div>

      {/* priority */}
      {issue?.priority && (
        <div className="flex-shrink-0">
          <IssueBlockPriority priority={issue?.priority} />
        </div>
      )}

      {/* state */}
      {issue?.state_detail && (
        <div className="flex-shrink-0">
          <IssueBlockState state={issue?.state_detail} />
        </div>
      )}

      {/* labels */}
      {issue?.label_details && issue?.label_details.length > 0 && (
        <div className="flex-shrink-0">
          <IssueBlockLabels labels={issue?.label_details} />
        </div>
      )}

      {/* due date */}
      {issue?.target_date && (
        <div className="flex-shrink-0">
          <IssueBlockDueDate due_date={issue?.target_date} group={issue?.state_detail?.group} />
        </div>
      )}
    </div>
  );
};
