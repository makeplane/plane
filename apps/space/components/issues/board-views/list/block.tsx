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

export const IssueListBlock = observer(({ issue }: { issue: IIssue }) => {
  const store: RootStore = useMobxStore();

  return (
    <div className="flex items-center px-9 py-3.5 relative gap-10 border-b border-custom-border-200 bg-custom-background-100 last:border-b-0">
      <div className="relative flex items-center gap-6 w-full flex-grow overflow-hidden">
        {/* id */}
        <div className="flex-shrink-0 text-sm w-[60px] text-custom-text-200">
          {store?.project?.project?.identifier}-{issue?.sequence_id}
        </div>
        {/* name */}
        <div className="h-full line-clamp-1 w-full overflow-ellipsis cursor-pointer">
          <p
            onClick={() => {
              store.issue.setActivePeekOverviewIssueId(issue.id);
            }}
            className="text-[0.825rem] font-medium text-sm truncate text-custom-text-100"
          >
            {issue.name}
          </p>
        </div>
      </div>

      <div className="inline-flex flex-shrink-0 items-center gap-2 text-xs">
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
    </div>
  );
});
