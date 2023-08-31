"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

// components
import { IssueBlockPriority } from "components/issues/board-views/block-priority";
import { IssueBlockState } from "components/issues/board-views/block-state";
import { IssueBlockLabels } from "components/issues/board-views/block-labels";
import { IssueBlockDueDate } from "components/issues/board-views/block-due-date";
// interfaces
import { IIssue } from "types/issue";
import { RootStore } from "store/root";

export const IssueListBlock = observer(({ issue }: { issue: IIssue }) => {
  const store: RootStore = useMobxStore();

  const { issue: issueStore } = store;

  return (
    <div className="py-3 px-4 h-[118px] flex flex-col gap-1.5 bg-custom-background-100 rounded shadow-custom-shadow-sm border-[0.5px] border-custom-border-200">
      {/* id */}
      <div className="text-xs text-custom-text-300 break-words">
        {store?.project?.project?.identifier}-{issue?.sequence_id}
      </div>

      {/* name */}
      <h6
        onClick={() => issueStore?.setActivePeekOverviewIssueId(issue?.id)}
        className="text-sm font-medium break-words line-clamp-2 cursor-pointer"
      >
        {issue.name}
      </h6>

      <div className="relative flex-grow flex items-end gap-2 w-full overflow-x-scroll hide-horizontal-scrollbar">
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
        {/* due date */}
        {issue?.target_date && (
          <div className="flex-shrink-0">
            <IssueBlockDueDate due_date={issue?.target_date} group={issue?.state_detail?.group} />
          </div>
        )}
      </div>
    </div>
  );
});
