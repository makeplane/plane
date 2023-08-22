"use client";

// mobx react lite
import { observer } from "mobx-react-lite";
// components
import { IssueListHeader } from "components/issues/board-views/list/header";
import { IssueListBlock } from "components/issues/board-views/list/block";
// interfaces
import { IIssueState, IIssue } from "store/types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueListView = observer(() => {
  const store: RootStore = useMobxStore();

  return (
    <>
      {store?.issue?.states &&
        store?.issue?.states.length > 0 &&
        store?.issue?.states.map((_state: IIssueState) => (
          <div className="relative w-full">
            <IssueListHeader state={_state} />
            {store.issue.getFilteredIssuesByState(_state.id) &&
            store.issue.getFilteredIssuesByState(_state.id).length > 0 ? (
              <div className="bg-white divide-y">
                {store.issue.getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                  <IssueListBlock issue={_issue} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-5 text-sm text-gray-600">No Issues are available.</div>
            )}
          </div>
        ))}
    </>
  );
});
