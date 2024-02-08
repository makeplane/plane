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
              <div className="divide-y divide-neutral-border-medium">
                {issueStore.getFilteredIssuesByState(_state.id).map((_issue: IIssue) => (
                  <IssueListBlock key={_issue.id} issue={_issue} />
                ))}
              </div>
            ) : (
              <div className="bg-neutral-component-surface-light p-3 text-sm text-neutral-text-subtle">No issues.</div>
            )}
          </div>
        ))}
    </>
  );
});
