// mobx react lite
import { observer } from "mobx-react-lite";
// interfaces
import { IIssueState } from "types/issue";
// ui
import { StateGroupIcon } from "@plane/ui";
// constants
import { issueGroupFilter } from "constants/data";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueListHeader = observer(({ state }: { state: IIssueState }) => {
  const store: RootStore = useMobxStore();

  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;

  return (
    <div className="flex items-center gap-2 p-3">
      <div className="flex h-3.5 w-3.5 items-center justify-center">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="14" width="14" />
      </div>
      <div className="mr-1 font-medium capitalize">{state?.name}</div>
      <div className="text-sm font-medium text-custom-text-200">{store.issue.getCountOfIssuesByState(state.id)}</div>
    </div>
  );
});
