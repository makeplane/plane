"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { IssueKanBanHeader } from "components/issues/board-views/kanban/header";
import { IssueKanBanBlock } from "components/issues/board-views/kanban/block";
// ui
import { Icon } from "components/ui";
// interfaces
import { IIssueState, IIssue } from "types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueKanbanView = observer(() => {
  const store: RootStore = useMobxStore();

  return (
    <div className="relative flex h-full w-full gap-3 overflow-hidden overflow-x-auto">
      {store?.issue?.states &&
        store?.issue?.states.length > 0 &&
        store?.issue?.states.map((_state: IIssueState) => (
          <div key={_state.id} className="relative flex h-full w-[340px] flex-shrink-0 flex-col">
            <div className="flex-shrink-0">
              <IssueKanBanHeader state={_state} />
            </div>
            <div className="hide-vertical-scrollbar h-full w-full overflow-hidden overflow-y-auto">
              {store.issue.getFilteredIssuesByState(_state.id) &&
              store.issue.getFilteredIssuesByState(_state.id).length > 0 ? (
                <div className="space-y-3 px-2 pb-2">
                  {store.issue.getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                    <IssueKanBanBlock key={_issue.id} issue={_issue} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 pt-10 text-center text-sm font-medium text-custom-text-200">
                  <Icon iconName="stack" />
                  No issues in this state
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
});
