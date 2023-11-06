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
    <div className="p-3 flex items-center gap-2">
      <div className="w-3.5 h-3.5 flex justify-center items-center">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="14" width="14" />
      </div>
      <div className="font-medium capitalize mr-1">{state?.name}</div>
      <div className="text-custom-text-200 text-sm font-medium">{store.issue.getCountOfIssuesByState(state.id)}</div>
    </div>
  );
});
