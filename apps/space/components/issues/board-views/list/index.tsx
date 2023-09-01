import { useEffect } from "react";
import { observer } from "mobx-react-lite";
// components
import { IssueListHeader } from "components/issues/board-views/list/header";
import { IssueListBlock } from "components/issues/board-views/list/block";
// interfaces
import { IIssueState, IIssue } from "types/issue";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
// store
import { RootStore } from "store/root";
import { useRouter } from "next/router";

export const IssueListView = observer(() => {
  const { issue: issueStore }: RootStore = useMobxStore();

  return (
    <>
      {issueStore?.states &&
        issueStore?.states.length > 0 &&
        issueStore?.states.map((_state: IIssueState) => (
          <div key={_state.id} className="relative w-full">
            <IssueListHeader state={_state} />
            {issueStore.getFilteredIssuesByState(_state.id) &&
            issueStore.getFilteredIssuesByState(_state.id).length > 0 ? (
              <div className="divide-y divide-custom-border-200">
                {issueStore.getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                  <IssueListBlock key={_issue.id} issue={_issue} />
                ))}
              </div>
            ) : (
              <div className="px-6 py-3.5 text-sm text-custom-text-200 bg-custom-background-100">
                No Issues are available.
              </div>
            )}
          </div>
        ))}
    </>
  );
});
