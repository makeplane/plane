// mobx react lite
import { observer } from "mobx-react-lite";
// interfaces
import { IIssueState } from "types/issue";
// icons
import { StateGroupIcon } from "components/icons";
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
    <div className="px-6 py-2 flex items-center">
      <div className="w-4 h-4 flex justify-center items-center">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
      </div>
      <div className="font-semibold capitalize ml-2 mr-3">{state?.name}</div>
      <div className="text-custom-text-200">{store.issue.getCountOfIssuesByState(state.id)}</div>
    </div>
  );
});
