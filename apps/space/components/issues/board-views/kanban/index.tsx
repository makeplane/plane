"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { IssueListHeader } from "components/issues/board-views/kanban/header";
import { IssueListBlock } from "components/issues/board-views/kanban/block";
// interfaces
import { IIssueState, IIssue } from "store/types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueKanbanView = observer(() => {
  const store: RootStore = useMobxStore();

  return (
    <div className="relative w-full h-full overflow-hidden overflow-x-auto flex gap-3">
      {store?.issue?.states &&
        store?.issue?.states.length > 0 &&
        store?.issue?.states.map((_state: IIssueState) => (
          <div className="flex-shrink-0 relative w-[340px] h-full flex flex-col">
            <div className="flex-shrink-0">
              <IssueListHeader state={_state} />
            </div>
            <div className="w-full h-full overflow-hidden overflow-y-auto">
              {store.issue.getFilteredIssuesByState(_state.id) &&
              store.issue.getFilteredIssuesByState(_state.id).length > 0 ? (
                <div className="space-y-3 pb-2">
                  {store.issue.getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                    <IssueListBlock issue={_issue} />
                  ))}
                </div>
              ) : (
                <div className="relative w-full h-full flex justify-center items-center p-10 text-center text-sm text-gray-600">
                  No Issues are available.
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
});
