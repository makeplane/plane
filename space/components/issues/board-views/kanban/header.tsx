// mobx react lite
import { observer } from "mobx-react-lite";
// interfaces
import { IIssueState } from "types/issue";
// constants
import { issueGroupFilter } from "constants/data";
// icons
import { StateGroupIcon } from "components/icons";
// mobx hook
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueListHeader = observer(({ state }: { state: IIssueState }) => {
  const store: RootStore = useMobxStore();

  const stateGroup = issueGroupFilter(state.group);

  if (stateGroup === null) return <></>;

  return (
    <div className="pb-2 px-2 flex items-center">
      <div className="w-4 h-4 flex justify-center items-center flex-shrink-0">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
      </div>
      <div className="font-semibold text-custom-text-200 capitalize ml-2 mr-3 truncate">{state?.name}</div>
      <span className="text-custom-text-300 rounded-full flex-shrink-0">
        {store.issue.getCountOfIssuesByState(state.id)}
      </span>
    </div>
  );
});
